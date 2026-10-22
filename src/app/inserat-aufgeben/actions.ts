"use server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { listingInput, toListingValues } from "@/lib/listings";
import { startPayment, startSlotsLeft } from "@/lib/billing";
import { isConfigured } from "@/lib/payrexx";
import { notifyAdmin } from "@/lib/mail";
import { appUrl, listingNo } from "@/lib/format";
import { PAID_PLANS, type PaidPlan } from "@/lib/plans";
import type { SubmitResult, WizardData } from "@/lib/wizard";

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

  const plan = data.plan;
  if (plan === "start") {
    if ((await startSlotsLeft()) <= 0) return { error: "Das Startangebot ist leider ausgeschöpft. Bitte wählen Sie ein Paket.", field: "plan" };
  } else if (!PAID_PLANS.includes(plan as PaidPlan)) {
    return { error: "Bitte ein Paket wählen." };
  } else if (!isConfigured()) {
    return { error: "Die Online-Zahlung ist noch nicht eingerichtet. Bitte wählen Sie das Startangebot oder versuchen Sie es später." };
  }

  const [ins] = await db.insert(schema.listings).values({
    ...v.values!, ownerId: user.id, plan, status: plan === "start" ? "in_review" : "pending_payment",
  }).$returningId();
  await db.insert(schema.subscriptions).values({ listingId: ins.id, plan, status: "pending" });
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, ins.id)).limit(1);

  if (plan === "start") {
    await notifyAdmin(`Neues Inserat zur Prüfung: ${listingNo(ins.id)}`, [listing.title, "Startangebot (gratis)."], `${appUrl()}/admin/inserate/${ins.id}`);
    redirect(`/inserat-aufgeben/danke?nr=${listingNo(ins.id)}`);
  }
  let link: string;
  try {
    link = await startPayment(listing, user, plan as PaidPlan, "initial");
  } catch (err) {
    console.error("[payrexx]", err);
    return { error: "Die Zahlungsseite konnte nicht geöffnet werden. Ihr Inserat ist als Entwurf gespeichert – Sie können die Zahlung in «Mein Bereich» erneut starten." };
  }
  redirect(link);
}

export async function updateListing(id: number, data: WizardData): Promise<SubmitResult> {
  const user = await getUser();
  if (!user) return { error: "Bitte melden Sie sich erneut an." };
  const [l] = await db.select().from(schema.listings).where(and(eq(schema.listings.id, id), eq(schema.listings.ownerId, user.id))).limit(1);
  if (!l) return { error: "Inserat nicht gefunden." };
  if (l.status === "sold" || l.status === "expired") return { error: "Beendete Inserate können nicht mehr bearbeitet werden." };
  if (l.status === "paused") return { error: "Bitte setzen Sie das Inserat zuerst fort, dann können Sie es bearbeiten." };
  if (!data.agb) return { error: "Bitte bestätigen Sie die Angaben und die AGB." };
  const v = validate({ ...data, type: l.type });
  if (v.error) return v.error;
  const resubmit = l.status === "online" || l.status === "rejected";
  const status = l.status === "online" || l.status === "rejected" ? "in_review" : l.status;
  await db.update(schema.listings).set({ ...v.values!, type: l.type, status, rejectionReason: null }).where(eq(schema.listings.id, id));
  if (resubmit && status === "in_review") {
    await notifyAdmin(`Inserat geändert, bitte prüfen: ${listingNo(id)}`, [v.values!.title], `${appUrl()}/admin/inserate/${id}`);
  }
  redirect("/konto?ok=gespeichert");
}
