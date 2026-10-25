import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { sendMail } from "./mail";
import { appUrl } from "./format";
import { mandateNo } from "./board";

export type ReviewKind = "org" | "profile" | "mandate";

/** Freischalten oder ablehnen von Partnerprofilen, VR-Profilen und VR-Mandaten, mit E-Mail an die einreichende Person */
export async function review(kind: ReviewKind, id: number, approve: boolean, reason: string, verified = false) {
  const now = new Date();
  if (kind === "org") {
    const [o] = await db.select().from(schema.orgs).where(eq(schema.orgs.id, id)).limit(1);
    if (!o) return;
    await db.update(schema.orgs).set(approve ? { status: "online", publishedAt: o.publishedAt ?? now, rejectionReason: null, verified } : { status: "rejected", rejectionReason: reason }).where(eq(schema.orgs.id, id));
    const admins = await db.select({ email: schema.users.email }).from(schema.orgMembers).innerJoin(schema.users, eq(schema.users.id, schema.orgMembers.userId))
      .where(sql`${schema.orgMembers.orgId} = ${id} AND ${schema.orgMembers.role} = 'admin'`);
    for (const a of admins) await sendMail({
      to: a.email,
      subject: approve ? `Ihr Partnerprofil ist online: ${o.name}` : `Partnerprofil nicht freigeschaltet: ${o.name}`,
      heading: approve ? "Ihr Partnerprofil ist online" : "Ihr Partnerprofil wurde nicht freigeschaltet",
      paragraphs: approve
        ? [`«${o.name}» ist jetzt im Partnerverzeichnis sichtbar.`, "Sie können ab sofort Angebote und VR-Mandate im Auftrag Ihrer Kunden inserieren und Ihr Team hinzufügen."]
        : [`Grund: ${reason}`, "Bitte passen Sie das Profil an und reichen Sie es erneut ein."],
      cta: approve ? { label: "Profil ansehen", url: `${appUrl()}/partner/${o.slug}` } : { label: "Profil bearbeiten", url: `${appUrl()}/partner/${o.slug}/bearbeiten` },
    });
    return;
  }
  if (kind === "profile") {
    const [p] = await db.select().from(schema.boardProfiles).where(eq(schema.boardProfiles.id, id)).limit(1);
    if (!p) return;
    await db.update(schema.boardProfiles).set(approve ? { status: "online", publishedAt: p.publishedAt ?? now, rejectionReason: null } : { status: "rejected", rejectionReason: reason }).where(eq(schema.boardProfiles.id, id));
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, p.userId)).limit(1);
    if (u) await sendMail({
      to: u.email,
      subject: approve ? "Ihr VR-Profil ist online" : "VR-Profil nicht freigeschaltet",
      heading: approve ? "Ihr VR-Profil ist online" : "Ihr VR-Profil wurde nicht freigeschaltet",
      paragraphs: approve ? ["Firmen finden Sie jetzt in der Suche nach Verwaltungsräten. In Ihrem Profil sehen Sie passende Mandate."] : [`Grund: ${reason}`, "Bitte passen Sie das Profil an und reichen Sie es erneut ein."],
      cta: { label: approve ? "Profil ansehen" : "Profil bearbeiten", url: approve ? `${appUrl()}/verwaltungsraete/profile/${p.id}` : `${appUrl()}/verwaltungsraete/mein-profil` },
    });
    return;
  }
  const [m] = await db.select().from(schema.boardMandates).where(eq(schema.boardMandates.id, id)).limit(1);
  if (!m) return;
  await db.update(schema.boardMandates).set(approve ? { status: "online", publishedAt: m.publishedAt ?? now, rejectionReason: null } : { status: "rejected", rejectionReason: reason }).where(eq(schema.boardMandates.id, id));
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, m.ownerId)).limit(1);
  if (u) await sendMail({
    to: u.email,
    subject: approve ? `Ihr VR-Mandat ist online: ${mandateNo(m.id)}` : `VR-Mandat nicht freigeschaltet: ${mandateNo(m.id)}`,
    heading: approve ? "Ihr VR-Mandat ist online" : "Ihr VR-Mandat wurde nicht freigeschaltet",
    paragraphs: approve ? [`«${m.title}» ist geprüft und ab sofort sichtbar. Anfragen erhalten Sie per E-Mail.`] : [`Grund: ${reason}`, "Bitte passen Sie das Mandat an und reichen Sie es erneut ein."],
    cta: { label: approve ? "Mandat ansehen" : "Mandat bearbeiten", url: approve ? `${appUrl()}/verwaltungsraete/mandate/${mandateNo(m.id)}` : `${appUrl()}/verwaltungsraete/mandat-inserieren?id=${m.id}` },
  });
}
