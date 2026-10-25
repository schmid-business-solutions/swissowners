"use server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { listingInput, toListingValues } from "@/lib/listings";
import { startPayment, startSlotsLeft } from "@/lib/billing";
import { isConfigured } from "@/lib/payrexx";
import { sendMail } from "@/lib/mail";
import { notifyAdminListing } from "@/lib/admin-mail";
import { appUrl, listingNo } from "@/lib/format";
import { PAID_PLANS, type PaidPlan } from "@/lib/plans";
import type { SubmitResult, WizardData } from "@/lib/wizard";
import { getOrg, membership } from "@/lib/orgs";

/** Partnerprofil prüfen: Mitglied, online, Auftrag bestätigt */
async function orgFields(data: WizardData, userId: number, keepId?: number | null): Promise<{ orgId: number | null; mandateConfirmed: boolean } | { error: string }> {
  if (!data.orgId) return { orgId: null, mandateConfirmed: false };
  const id = Number(data.orgId);
  const mem = await membership(id, userId);
  const o = await getOrg(id);
  if (!mem || !o || (o.status !== "online" && o.id !== keepId)) return { error: "Dieses Partnerprofil ist nicht verfügbar." };
  if (!data.mandateConfirmed) return { error: "Bitte bestätigen Sie den Auftrag Ihres Kunden." };
  return { orgId: id, mandateConfirmed: true };
}

function validate(data: WizardData) {
  const r = listingInput.safeParse({
    ...data,
    employees: data.employees,
    companyInformed: data.companyInformed ? "true" : "",
  });
  if (!r.success) {
    const i = r.error.issues[0];
    return { error: { error: i.message, field: String(i.path[0] ?? "") } as SubmitResult };
  }
  return { values: toListingValues(r.data) };
}

export async function createListing(data: WizardData): Promise<SubmitResult> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich erneut an." };
  if (!user.emailVerifiedAt) return { error: "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse." };
  if (!data.agb) return { error: "Bitte bestätigen Sie die Angaben und die AGB." };
  const v = validate(data);
  if (v.error) return v.error;
  const of = await orgFields(data, user.id);
  if ("error" in of) return { error: of.error };

  const plan = data.plan;
  if (plan === "start") {
    if ((await startSlotsLeft()) <= 0) return { error: "Das Startangebot ist leider ausgeschöpft. Bitte wählen Sie ein Paket.", field: "plan" };
  } else if (!PAID_PLANS.includes(plan as PaidPlan)) {
    return { error: "Bitte ein Paket wählen." };
  } else if (!isConfigured()) {
    return { error: "Die Online-Zahlung ist noch nicht eingerichtet. Bitte wählen Sie das Startangebot oder versuchen Sie es später." };
  }

  const [ins] = await db.insert(schema.listings).values({
    ...v.values!, ...of, ownerId: user.id, plan, status: plan === "start" ? "in_review" : "pending_payment",
  }).$returningId();
  await db.insert(schema.subscriptions).values({ listingId: ins.id, plan, status: "pending" });
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, ins.id)).limit(1);

  if (plan === "start") {
    await notifyAdminListing(listing, `Neues Angebot zur Prüfung: ${listingNo(ins.id)}`, "gratis");
    await sendMail({
      to: user.email,
      subject: `Angebot eingereicht: ${listingNo(ins.id)}`,
      heading: "Vielen Dank – Ihr Angebot ist eingereicht",
      paragraphs: [
        `Guten Tag ${user.firstName} ${user.lastName}`,
        `Wir haben Ihr Angebot «${listing.title}» (${listingNo(ins.id)}) erhalten.`,
        "Wir prüfen jetzt Ihre Angaben und den Handelsregistereintrag – in der Regel innerhalb eines Werktags. Sobald das Angebot freigeschaltet ist, erhalten Sie eine weitere E-Mail.",
        "Ihr Startangebot ist kostenlos und läuft 60 Tage ab Freischaltung. Bis dahin können Sie das Angebot in «Mein Bereich» jederzeit ansehen und anpassen.",
        "Freundliche Grüsse\nIhr SwissOwners-Team",
      ],
      cta: { label: "Zu meinen Angeboten", url: `${appUrl()}/konto` },
    });
    redirect(`/inserat-aufgeben/danke?nr=${listingNo(ins.id)}`);
  }
  let link: string;
  try {
    link = await startPayment(listing, user, plan as PaidPlan, "initial");
  } catch (err) {
    console.error("[payrexx]", err);
    return { error: "Die Zahlungsseite konnte nicht geöffnet werden. Ihr Angebot ist als Entwurf gespeichert – Sie können die Zahlung in «Mein Bereich» erneut starten." };
  }
  redirect(link);
}

export async function updateListing(id: number, data: WizardData): Promise<SubmitResult> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich erneut an." };
  const [l] = await db.select().from(schema.listings).where(and(eq(schema.listings.id, id), eq(schema.listings.ownerId, user.id))).limit(1);
  if (!l) return { error: "Angebot nicht gefunden." };
  if (l.status === "sold" || l.status === "expired") return { error: "Beendete Angebote können nicht mehr bearbeitet werden." };
  if (l.status === "paused") return { error: "Bitte setzen Sie das Angebot zuerst fort, dann können Sie es bearbeiten." };
  if (!data.agb) return { error: "Bitte bestätigen Sie die Angaben und die AGB." };
  const v = validate({ ...data, type: l.type });
  if (v.error) return v.error;
  const of = await orgFields(data, user.id, l.orgId);
  if ("error" in of) return { error: of.error };
  const resubmit = l.status === "online" || l.status === "rejected";
  const status = l.status === "online" || l.status === "rejected" ? "in_review" : l.status;
  await db.update(schema.listings).set({ ...v.values!, ...of, type: l.type, status, rejectionReason: null }).where(eq(schema.listings.id, id));
  if (resubmit && status === "in_review") {
    const [fresh] = await db.select().from(schema.listings).where(eq(schema.listings.id, id)).limit(1);
    if (fresh) await notifyAdminListing(fresh, `Angebot geändert, bitte prüfen: ${listingNo(id)}`, l.status === "rejected" ? "nach Ablehnung neu eingereicht" : "Änderung an einem Online-Angebot");
  }
  redirect("/konto?ok=gespeichert");
}
