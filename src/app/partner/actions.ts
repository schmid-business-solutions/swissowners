"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth";
import { notifyAdmin, sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/format";
import { getOrg, membership, orgFormData, orgInput, toOrgValues, uniqueSlug } from "@/lib/orgs";
import { ORG_KIND_LABEL } from "@/lib/taxonomy";

export type FormState = { error?: string; ok?: string } | undefined;

export async function saveOrg(orgId: number | null, _: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich erneut an." };
  if (!user.emailVerifiedAt) return { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." };
  if (fd.get("confirm") !== "on") return { error: "Bitte bestätigen Sie, dass Sie die Organisation vertreten dürfen, und die AGB." };
  const r = orgInput.safeParse(orgFormData(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Bitte Angaben prüfen." };
  const v = toOrgValues(r.data);

  if (orgId == null) {
    const slug = await uniqueSlug(v.name);
    const [ins] = await db.insert(schema.orgs).values({ ...v, slug, status: "in_review", createdBy: user.id }).$returningId();
    await db.insert(schema.orgMembers).values({ orgId: ins.id, userId: user.id, role: "admin" });
    await notifyAdmin(`Neues Partnerprofil zur Prüfung: ${v.name}`, [`${ORG_KIND_LABEL[v.kind]} · ${v.city} (${v.kanton})`, v.tagline, `Erfasst von ${user.firstName} ${user.lastName} (${user.email})`],
      `${appUrl()}/admin/pruefung`, { ctaLabel: "Prüfen und freischalten", facts: [["UID", v.uid ?? "–"], ["Website", v.website ?? "–"], ["E-Mail", v.email]] });
    await sendMail({
      to: user.email, subject: `Partnerprofil eingereicht: ${v.name}`, heading: "Vielen Dank – Ihr Partnerprofil ist eingereicht",
      paragraphs: [`Wir prüfen das Profil «${v.name}» persönlich, in der Regel innerhalb eines Werktags und melden uns per E-Mail.`, "Während der Beta ist das Partnerprofil kostenlos. Nach der Freischaltung können Sie Angebote und VR-Mandate im Auftrag Ihrer Kunden inserieren und Ihr Team hinzufügen."],
      cta: { label: "Zu Mein Bereich", url: `${appUrl()}/konto?tab=partner` },
    });
    revalidatePath("/konto");
    redirect("/konto?tab=partner&ok=partner-eingereicht");
  }

  const o = await getOrg(orgId);
  const mem = o ? await membership(o.id, user.id) : undefined;
  if (!o || mem?.role !== "admin") return { error: "Nur Administratoren des Partnerprofils können es bearbeiten." };
  const slug = v.name !== o.name ? await uniqueSlug(v.name, o.id) : o.slug;
  const status = o.status === "online" || o.status === "rejected" ? "in_review" : o.status;
  await db.update(schema.orgs).set({ ...v, slug, status, rejectionReason: null }).where(eq(schema.orgs.id, o.id));
  await notifyAdmin(`Partnerprofil geändert, bitte prüfen: ${v.name}`, [`Geändert von ${user.firstName} ${user.lastName}`], `${appUrl()}/admin/pruefung`, { ctaLabel: "Prüfen" });
  revalidatePath(`/partner/${slug}`);
  redirect("/konto?tab=partner&ok=partner-gespeichert");
}

async function adminOf(fd: FormData) {
  const user = await requireUser("/konto?tab=partner");
  const orgId = Number(fd.get("orgId"));
  const mem = await membership(orgId, user.id);
  if (mem?.role !== "admin") redirect("/konto?tab=partner&err=keine-rechte");
  return { user, orgId };
}

export async function addMemberAction(fd: FormData) {
  const { user, orgId } = await adminOf(fd);
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u) redirect("/konto?tab=partner&err=kein-konto");
  const exists = await membership(orgId, u.id);
  if (!exists) await db.insert(schema.orgMembers).values({ orgId, userId: u.id, role: fd.get("role") === "admin" ? "admin" : "member" });
  const o = await getOrg(orgId);
  await sendMail({
    to: u.email, subject: `Sie wurden zu ${o?.name ?? "einem Partnerprofil"} hinzugefügt`, heading: "Willkommen im Team",
    paragraphs: [`${user.firstName} ${user.lastName} hat Sie zum Partnerprofil «${o?.name}» auf SwissOwners hinzugefügt.`, "Sie können jetzt Angebote und VR-Mandate im Auftrag von Kunden über dieses Profil inserieren."],
    cta: { label: "Zu Mein Bereich", url: `${appUrl()}/konto?tab=partner` },
  });
  revalidatePath("/konto");
  redirect("/konto?tab=partner&ok=mitglied");
}

export async function removeMemberAction(fd: FormData) {
  const { user, orgId } = await adminOf(fd);
  const uid = Number(fd.get("userId"));
  if (uid === user.id) redirect("/konto?tab=partner&err=selbst");
  await db.delete(schema.orgMembers).where(and(eq(schema.orgMembers.orgId, orgId), eq(schema.orgMembers.userId, uid)));
  revalidatePath("/konto");
  redirect("/konto?tab=partner&ok=entfernt");
}
