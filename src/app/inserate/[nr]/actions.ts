"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getListing } from "@/lib/listings";
import { sendMail } from "@/lib/mail";
import { allow, clientIp } from "@/lib/rate-limit";
import { appUrl, listingNo } from "@/lib/format";

export type RequestState = { error?: string; ok?: boolean } | undefined;

export async function sendRequest(listingId: number, _: RequestState, fd: FormData): Promise<RequestState> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich an." };
  if (!user.emailVerifiedAt) return { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." };
  const listing = await getListing(listingId);
  if (!listing || listing.status !== "online") return { error: "Dieses Angebot ist nicht mehr verfügbar." };
  if (listing.isSample) return { error: "Musterangebote nehmen keine Anfragen an." };
  if (listing.ownerId === user.id) return { error: "Das ist Ihr eigenes Angebot." };
  if (fd.get("nda") !== "on") return { error: "Bitte bestätigen Sie die Vertraulichkeitserklärung." };
  if (fd.get("share") !== "on") return { error: "Bitte bestätigen Sie die Weitergabe Ihrer Kontaktdaten." };
  const message = String(fd.get("message") ?? "").trim();
  if (message.length < 20) return { error: "Bitte schreiben Sie mindestens 20 Zeichen." };
  if (message.length > 3000) return { error: "Die Nachricht ist zu lang (max. 3000 Zeichen)." };
  const phone = String(fd.get("phone") ?? "").trim().slice(0, 40);
  if (!allow(`req:${user.id}`, 15, 86_400_000)) return { error: "Sie haben heute bereits viele Anfragen gesendet. Bitte morgen erneut versuchen." };

  const [exists] = await db.select({ id: schema.contactRequests.id }).from(schema.contactRequests)
    .where(and(eq(schema.contactRequests.listingId, listingId), eq(schema.contactRequests.senderId, user.id))).limit(1);
  if (exists) return { ok: true };

  const name = `${user.firstName} ${user.lastName}`;
  await db.insert(schema.contactRequests).values({
    listingId, senderId: user.id, message, ndaName: name, ndaAcceptedAt: new Date(), ndaIp: await clientIp(),
  });
  if (phone && phone !== user.phone) await db.update(schema.users).set({ phone }).where(eq(schema.users.id, user.id));

  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, listing.ownerId)).limit(1);
  if (owner) {
    await sendMail({
      to: owner.email,
      replyTo: user.email,
      subject: `Neue Anfrage zu ${listingNo(listing.id)}: ${listing.title}`,
      heading: "Sie haben eine neue Anfrage erhalten",
      paragraphs: [
        `Zu Ihrem Angebot «${listing.title}» (${listingNo(listing.id)}).`,
        `Von: ${name}\nE-Mail: ${user.email}${phone || user.phone ? `\nTelefon: ${phone || user.phone}` : ""}`,
        `Nachricht:\n${message}`,
        `${name} hat die Vertraulichkeitserklärung digital unterzeichnet. Antworten Sie direkt auf diese E-Mail – sie geht an ${user.email}.`,
      ],
      cta: { label: "Alle Anfragen ansehen", url: `${appUrl()}/konto?tab=anfragen` },
    });
  }
  await sendMail({
    to: user.email,
    subject: `Ihre Anfrage zu ${listingNo(listing.id)}`,
    heading: "Ihre Anfrage wurde gesendet",
    paragraphs: [
      `Wir haben Ihre Nachricht zu «${listing.title}» an den Inserenten weitergeleitet. Er antwortet Ihnen direkt per E-Mail.`,
      `Firma: ${listing.companyName} (${listing.companyUid})`,
      "Bitte denken Sie an die Vertraulichkeitserklärung, die Sie unterzeichnet haben.",
    ],
  });
  revalidatePath(`/inserate/${listingNo(listingId)}`);
  return { ok: true };
}

export async function toggleSave(listingId: number) {
  const user = await getUser();
  if (!user) return { login: true };
  const where = and(eq(schema.savedListings.userId, user.id), eq(schema.savedListings.listingId, listingId));
  const [row] = await db.select().from(schema.savedListings).where(where).limit(1);
  if (row) await db.delete(schema.savedListings).where(where);
  else await db.insert(schema.savedListings).values({ userId: user.id, listingId });
  revalidatePath(`/inserate/${listingNo(listingId)}`);
  return { saved: !row };
}
