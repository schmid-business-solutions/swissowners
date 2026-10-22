"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cancelListing, endListing, getSubscription, pauseListing, resumeListing, startPayment } from "@/lib/billing";
import { isConfigured } from "@/lib/payrexx";
import { PAID_PLANS, type PaidPlan } from "@/lib/plans";

async function own(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const [l] = await db.select().from(schema.listings).where(and(eq(schema.listings.id, id), eq(schema.listings.ownerId, user.id))).limit(1);
  if (!l) redirect("/konto?err=nicht-gefunden");
  return { user, l };
}

const done = (msg: string) => { revalidatePath("/konto"); redirect(`/konto?ok=${msg}`); };

export async function pauseAction(fd: FormData) {
  const { l } = await own(fd);
  await pauseListing(l);
  done("pausiert");
}

export async function resumeAction(fd: FormData) {
  const { l } = await own(fd);
  await resumeListing(l);
  done("fortgesetzt");
}

export async function cancelAction(fd: FormData) {
  const { l } = await own(fd);
  if (l.plan === "start") await endListing(l, "expired");
  else await cancelListing(l);
  done("gekuendigt");
}

export async function soldAction(fd: FormData) {
  const { l } = await own(fd);
  if (l.status === "online" || l.status === "paused") await endListing(l, "sold");
  done("verkauft");
}

export async function deleteAction(fd: FormData) {
  const { l } = await own(fd);
  // Nur nie veröffentlichte, unbezahlte Angebote dürfen gelöscht werden
  if (!l.publishedAt && ["draft", "pending_payment", "rejected"].includes(l.status)) {
    const paid = await db.select({ id: schema.payments.id }).from(schema.payments)
      .where(and(eq(schema.payments.listingId, l.id), eq(schema.payments.status, "paid"))).limit(1);
    if (!paid.length) await db.delete(schema.listings).where(eq(schema.listings.id, l.id));
  }
  done("geloescht");
}

/** Bezahlen: Erstzahlung abschliessen, Paket wählen (Start → bezahlt, Wiederaktivierung) oder fehlgeschlagene Verlängerung nachzahlen */
export async function payAction(fd: FormData) {
  const { user, l } = await own(fd);
  if (!isConfigured()) redirect("/konto?err=zahlung-inaktiv");
  const sub = await getSubscription(l.id);
  let plan = String(fd.get("plan") ?? l.plan) as PaidPlan;
  if (!PAID_PLANS.includes(plan)) plan = "plus";
  let kind: "initial" | "upgrade" | "reactivation";
  if (l.status === "pending_payment") kind = "initial";
  else if (sub?.status === "past_due") { kind = "reactivation"; plan = l.plan as PaidPlan; }
  else if ((l.status === "online" && l.plan === "start") || l.status === "expired") kind = "upgrade";
  else redirect("/konto");
  if (kind === "initial" && plan !== l.plan) {
    await db.update(schema.listings).set({ plan }).where(eq(schema.listings.id, l.id));
  }
  let link = "";
  try {
    link = await startPayment({ ...l, plan }, user, plan, kind);
  } catch (err) {
    console.error("[payrexx]", err);
    redirect("/konto?err=zahlung");
  }
  redirect(link);
}
