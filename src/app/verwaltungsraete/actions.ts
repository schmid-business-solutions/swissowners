"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser, requireUser } from "@/lib/auth";
import { notifyAdmin, sendMail } from "@/lib/mail";
import { appUrl } from "@/lib/format";
import { mandateFormData, mandateInput, mandateNo, myProfile, profileFormData, profileInput, toMandateValues, toProfileValues } from "@/lib/board";
import { getOrg, membership } from "@/lib/orgs";
import { BOARD_ROLE_LABEL } from "@/lib/taxonomy";

export type FormState = { error?: string } | undefined;

export async function saveProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich erneut an." };
  if (!user.emailVerifiedAt) return { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." };
  if (fd.get("confirm") !== "on") return { error: "Bitte bestätigen Sie die Angaben und die AGB." };
  const r = profileInput.safeParse(profileFormData(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Bitte Angaben prüfen." };
  const v = toProfileValues(r.data);
  const displayName = `${user.firstName} ${user.lastName}`;
  const existing = await myProfile(user.id);
  if (existing) {
    const status = existing.status === "paused" ? "paused" : "in_review";
    await db.update(schema.boardProfiles).set({ ...v, displayName, status, rejectionReason: null }).where(eq(schema.boardProfiles.id, existing.id));
  } else {
    await db.insert(schema.boardProfiles).values({ ...v, displayName, userId: user.id, status: "in_review" });
  }
  await notifyAdmin(`${existing ? "VR-Profil geändert" : "Neues VR-Profil"} zur Prüfung: ${displayName}`, [v.headline, `Kompetenzen: ${v.skills}`, `${user.email}`], `${appUrl()}/admin/pruefung`, { ctaLabel: "Prüfen und freischalten" });
  if (!existing) await sendMail({
    to: user.email, subject: "VR-Profil eingereicht", heading: "Vielen Dank – Ihr VR-Profil ist eingereicht",
    paragraphs: ["Wir prüfen Ihr Profil in der Regel innerhalb eines Werktags und schalten es dann frei.", "Danach finden Firmen Sie in der Suche, und Sie sehen passende Mandate. Während der Beta ist das Profil kostenlos."],
    cta: { label: "Zu Mein Bereich", url: `${appUrl()}/konto?tab=vr` },
  });
  revalidatePath("/verwaltungsraete");
  redirect("/konto?tab=vr&ok=profil-eingereicht");
}

export async function profileVisibleAction(fd: FormData) {
  const user = await requireUser("/konto?tab=vr");
  const p = await myProfile(user.id);
  if (p) {
    const pause = fd.get("pause") === "1";
    if (pause && p.status === "online") await db.update(schema.boardProfiles).set({ status: "paused" }).where(eq(schema.boardProfiles.id, p.id));
    if (!pause && p.status === "paused") await db.update(schema.boardProfiles).set({ status: p.publishedAt ? "online" : "in_review" }).where(eq(schema.boardProfiles.id, p.id));
  }
  revalidatePath("/verwaltungsraete");
  redirect("/konto?tab=vr");
}

export async function saveMandate(mandateId: number | null, _: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich erneut an." };
  if (!user.emailVerifiedAt) return { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." };
  if (fd.get("confirm") !== "on") return { error: "Bitte bestätigen Sie die Angaben und die AGB." };
  const r = mandateInput.safeParse(mandateFormData(fd));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Bitte Angaben prüfen." };
  const v = toMandateValues(r.data);
  let orgId: number | null = null;
  if (r.data.orgId) {
    const o = await getOrg(Number(r.data.orgId));
    if (!o || o.status !== "online" || !(await membership(o.id, user.id))) return { error: "Dieses Partnerprofil ist nicht verfügbar." };
    if (fd.get("mandate") !== "on") return { error: "Bitte bestätigen Sie den Auftrag Ihres Kunden." };
    orgId = o.id;
  }
  if (mandateId == null) {
    const [ins] = await db.insert(schema.boardMandates).values({ ...v, orgId, ownerId: user.id, status: "in_review" }).$returningId();
    await notifyAdmin(`Neues VR-Mandat zur Prüfung: ${mandateNo(ins.id)}`, [`${BOARD_ROLE_LABEL[v.role]} · ${v.title}`, `Firma: ${v.companyName} (${v.companyUid})`, `${user.firstName} ${user.lastName} · ${user.email}`], `${appUrl()}/admin/pruefung`, { ctaLabel: "Prüfen und freischalten" });
    await sendMail({
      to: user.email, subject: `VR-Mandat eingereicht: ${mandateNo(ins.id)}`, heading: "Vielen Dank – Ihr VR-Mandat ist eingereicht",
      paragraphs: [`Wir prüfen «${v.title}» und den Handelsregistereintrag in der Regel innerhalb eines Werktags.`, "Nach der Freischaltung ist das Mandat 60 Tage online. Während der Beta ist es kostenlos."],
      cta: { label: "Zu Mein Bereich", url: `${appUrl()}/konto?tab=vr` },
    });
  } else {
    const [m] = await db.select().from(schema.boardMandates).where(and(eq(schema.boardMandates.id, mandateId), eq(schema.boardMandates.ownerId, user.id))).limit(1);
    if (!m) return { error: "Mandat nicht gefunden." };
    if (m.status === "expired") return { error: "Beendete Mandate können nicht mehr bearbeitet werden." };
    await db.update(schema.boardMandates).set({ ...v, orgId, status: "in_review", rejectionReason: null }).where(eq(schema.boardMandates.id, m.id));
    await notifyAdmin(`VR-Mandat geändert, bitte prüfen: ${mandateNo(m.id)}`, [v.title], `${appUrl()}/admin/pruefung`, { ctaLabel: "Prüfen" });
  }
  revalidatePath("/verwaltungsraete");
  redirect("/konto?tab=vr&ok=mandat-eingereicht");
}

export async function endMandateAction(fd: FormData) {
  const user = await requireUser("/konto?tab=vr");
  const id = Number(fd.get("id"));
  await db.update(schema.boardMandates).set({ status: "expired" }).where(and(eq(schema.boardMandates.id, id), eq(schema.boardMandates.ownerId, user.id)));
  revalidatePath("/verwaltungsraete");
  redirect("/konto?tab=vr&ok=mandat-beendet");
}
