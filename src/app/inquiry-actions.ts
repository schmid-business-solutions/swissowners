"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { allow } from "@/lib/rate-limit";
import { appUrl } from "@/lib/format";
import { getMandate, getProfile, mandateNo, myProfile } from "@/lib/board";
import { getOrg, orgMembersOf } from "@/lib/orgs";

export type InquiryState = { error?: string; ok?: boolean } | undefined;
type Kind = "mandate" | "profile" | "org";

/** Anfrage an ein VR-Mandat, ein VR-Profil oder einen Partner. Wird per E-Mail weitergeleitet (Antwort direkt an die anfragende Person). */
export async function sendInquiry(kind: Kind, targetId: number, path: string, _: InquiryState, fd: FormData): Promise<InquiryState> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich an." };
  if (!user.emailVerifiedAt) return { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." };
  const message = String(fd.get("message") ?? "").trim();
  if (message.length < 20) return { error: "Bitte schreiben Sie mindestens 20 Zeichen." };
  if (message.length > 3000) return { error: "Die Nachricht ist zu lang (max. 3000 Zeichen)." };
  if (fd.get("share") !== "on") return { error: "Bitte bestätigen Sie die Weitergabe Ihrer Kontaktdaten." };
  if (kind === "mandate" && fd.get("nda") !== "on") return { error: "Bitte bestätigen Sie die Vertraulichkeit." };
  if (!allow(`inq:${user.id}`, 20, 86_400_000)) return { error: "Sie haben heute bereits viele Anfragen gesendet. Bitte morgen erneut versuchen." };

  // Empfänger und Betreff je nach Art
  let to: string[] = [];
  let subject = "", what = "", reveal = "";
  if (kind === "mandate") {
    const m = await getMandate(targetId);
    if (!m || m.status !== "online") return { error: "Dieses Mandat ist nicht mehr verfügbar." };
    if (m.isSample) return { error: "Mustermandate nehmen keine Anfragen an." };
    if (m.ownerId === user.id) return { error: "Das ist Ihr eigenes Mandat." };
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, m.ownerId)).limit(1);
    to = owner ? [owner.email] : [];
    subject = `Interesse an Ihrem VR-Mandat ${mandateNo(m.id)}: ${m.title}`;
    what = `Ihr VR-Mandat «${m.title}» (${mandateNo(m.id)})`;
    reveal = `Firma: ${m.companyName} (${m.companyUid})`;
  } else if (kind === "profile") {
    const p = await getProfile(targetId);
    if (!p || p.status !== "online") return { error: "Dieses Profil ist nicht mehr verfügbar." };
    if (p.isSample) return { error: "Musterprofile nehmen keine Anfragen an." };
    if (p.userId === user.id) return { error: "Das ist Ihr eigenes Profil." };
    const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, p.userId)).limit(1);
    to = owner ? [owner.email] : [];
    subject = `Kontaktanfrage zu Ihrem VR-Profil`;
    what = `Ihr VR-Profil «${p.headline}»`;
  } else {
    const o = await getOrg(targetId);
    if (!o || o.status !== "online") return { error: "Dieser Partner ist nicht mehr verfügbar." };
    if (o.isSample) return { error: "Musterpartner nehmen keine Anfragen an." };
    const members = await orgMembersOf(o.id);
    to = [...new Set([o.email, ...members.filter((x) => x.m.role === "admin").map((x) => x.u.email)])];
    subject = `Anfrage über SwissOwners an ${o.name}`;
    what = `Ihr Partnerprofil «${o.name}»`;
  }

  const [exists] = await db.select({ id: schema.inquiries.id }).from(schema.inquiries)
    .where(and(eq(schema.inquiries.kind, kind), eq(schema.inquiries.targetId, targetId), eq(schema.inquiries.senderId, user.id))).limit(1);
  if (exists) return { ok: true };
  await db.insert(schema.inquiries).values({ kind, targetId, senderId: user.id, message, ndaAcceptedAt: kind === "mandate" ? new Date() : null });

  const name = `${user.firstName} ${user.lastName}`;
  const own = await myProfile(user.id);
  const profileLine = own && own.status === "online" ? `\nVR-Profil: ${appUrl()}/verwaltungsraete/profile/${own.id}` : "";
  for (const addr of to) {
    await sendMail({
      to: addr, replyTo: user.email, subject,
      heading: "Sie haben eine neue Anfrage erhalten",
      paragraphs: [
        `Zu ${what}.`,
        `Von: ${name}\nE-Mail: ${user.email}${user.phone ? `\nTelefon: ${user.phone}` : ""}${profileLine}`,
        `Nachricht:\n${message}`,
        kind === "mandate" ? `${name} hat bestätigt, die Angaben zur Firma vertraulich zu behandeln. Antworten Sie direkt auf diese E-Mail.` : "Antworten Sie direkt auf diese E-Mail.",
      ],
      cta: { label: "Zu Mein Bereich", url: `${appUrl()}/konto?tab=anfragen` },
    });
  }
  await sendMail({
    to: user.email,
    subject: "Ihre Anfrage wurde gesendet",
    heading: "Ihre Anfrage wurde gesendet",
    paragraphs: [`Wir haben Ihre Nachricht weitergeleitet. Sie erhalten die Antwort direkt per E-Mail.`, ...(reveal ? [reveal, "Bitte behandeln Sie diese Angaben vertraulich."] : [])],
  });
  revalidatePath(path);
  return { ok: true };
}
