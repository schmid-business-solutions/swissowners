import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, lte, notInArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { Listing, Payment, Subscription, User } from "./db/schema";
import {
  FIRST_PERIOD_DAYS, MAX_PAUSE_DAYS, PLANS, REMIND_RENEWAL_DAYS, REMIND_START_DAYS, RENEWAL_DAYS,
  planName, startOffer, type PaidPlan, type Plan,
} from "./plans";
import * as px from "./payrexx";
import { addDays, appUrl, chf, date, listingNo } from "./format";
import { sendMail } from "./mail";
import { notifyAdminListing } from "./admin-mail";

const DAY = 86_400_000;
type Affected = { affectedRows: number };
const affected = (r: unknown) => ((r as [Affected])[0]?.affectedRows ?? 0);

/* ---------- Startangebot ---------- */
export async function startSlotsLeft(): Promise<number> {
  const { slots, until } = startOffer();
  if (Date.now() > until.getTime()) return 0;
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.listings)
    .where(and(eq(schema.listings.plan, "start"), eq(schema.listings.isSample, false), notInArray(schema.listings.status, ["draft", "rejected"])));
  return Math.max(0, slots - Number(row?.n ?? 0));
}

export async function getSubscription(listingId: number): Promise<Subscription | undefined> {
  const [s] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.listingId, listingId)).limit(1);
  return s;
}

/* ---------- Zahlungen ---------- */
export type PaymentKind = Payment["kind"];

function priceFor(plan: PaidPlan, kind: PaymentKind) {
  return kind === "renewal" || kind === "reactivation" ? PLANS[plan].renewal : PLANS[plan].first;
}

/** Legt eine offene Zahlung an und erstellt die Payrexx-Zahlungsseite. Gibt den Link zurück. */
export async function startPayment(listing: Listing, user: User, plan: PaidPlan, kind: PaymentKind): Promise<string> {
  const amount = priceFor(plan, kind);
  const reference = `SWO-${listing.id}-${randomBytes(4).toString("hex")}`;
  const [ins] = await db.insert(schema.payments).values({
    reference, listingId: listing.id, userId: user.id, kind, plan, amountRappen: amount * 100,
  }).$returningId();
  const base = appUrl();
  const purpose = `SwissOwners ${listingNo(listing.id)} · Paket ${PLANS[plan].name}` +
    (kind === "initial" || kind === "upgrade" ? ` · ${FIRST_PERIOD_DAYS} Tage` : ` · ${RENEWAL_DAYS} Tage`);
  const gw = await px.createGateway({
    amountRappen: amount * 100,
    purpose,
    referenceId: reference,
    successUrl: `${base}/zahlung/erfolg?ref=${reference}`,
    failedUrl: `${base}/zahlung/fehler?ref=${reference}`,
    cancelUrl: `${base}/zahlung/abbruch?ref=${reference}`,
    email: user.email, firstName: user.firstName, lastName: user.lastName,
    tokenize: true,
  });
  await db.update(schema.payments).set({ payrexxGatewayId: gw.id }).where(eq(schema.payments.id, ins.id));
  return gw.link;
}

/** Prüft eine Zahlung bei Payrexx und wendet sie einmalig an (idempotent – Webhook und Rückleitung dürfen beide aufrufen). */
export async function confirmPayment(reference: string): Promise<"paid" | "open" | "failed" | "unknown"> {
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference)).limit(1);
  if (!p) return "unknown";
  if (p.status === "paid") return "paid";
  if (!p.payrexxGatewayId) return "open";
  const gw = await px.getGateway(p.payrexxGatewayId);
  const ev = px.evaluateGateway(gw);
  if (!ev.paid) {
    if (gw.status === "declined" || gw.status === "error") {
      await db.update(schema.payments).set({ status: "failed" }).where(and(eq(schema.payments.id, p.id), eq(schema.payments.status, "open")));
      return "failed";
    }
    return "open";
  }
  const res = await db.update(schema.payments)
    .set({ status: "paid", paidAt: new Date(), payrexxTxId: ev.txId })
    .where(and(eq(schema.payments.id, p.id), eq(schema.payments.status, "open")));
  if (affected(res) === 0) return "paid"; // parallel bereits angewendet
  await applyPayment(p, ev.tokenTxId);
  return "paid";
}

async function applyPayment(p: Payment, tokenTxId: number | null) {
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, p.listingId)).limit(1);
  const sub = await getSubscription(p.listingId);
  if (!listing || !sub) return;
  const now = new Date();
  const token = tokenTxId ?? sub.payrexxTokenTxId;
  const plan = p.plan as PaidPlan;

  if (p.kind === "initial") {
    // Laufzeit startet erst mit der Freischaltung durch uns
    await db.update(schema.subscriptions).set({ plan, payrexxTokenTxId: token }).where(eq(schema.subscriptions.id, sub.id));
    await db.update(schema.listings).set({ plan, status: "in_review" })
      .where(and(eq(schema.listings.id, listing.id), eq(schema.listings.status, "pending_payment")));
    await notifyAdminListing({ ...listing, plan }, `Neues Angebot zur Prüfung: ${listingNo(listing.id)}`, `bezahlt (${chf(p.amountRappen / 100)})`);
  } else if (p.kind === "upgrade") {
    const from = sub.periodEnd && sub.periodEnd > now && sub.status === "active" ? sub.periodEnd : now;
    await db.update(schema.subscriptions).set({
      plan, status: "active", periodEnd: addDays(from, FIRST_PERIOD_DAYS), cancelAtPeriodEnd: false,
      pausedAt: null, pausedRemainingDays: null, payrexxTokenTxId: token, remindedFor: null,
    }).where(eq(schema.subscriptions.id, sub.id));
    const status = listing.publishedAt ? "online" : listing.status === "draft" || listing.status === "pending_payment" ? "in_review" : listing.status;
    await db.update(schema.listings).set({ plan, status: status === "expired" || status === "paused" ? "online" : status }).where(eq(schema.listings.id, listing.id));
  } else {
    // renewal / reactivation (nach fehlgeschlagener automatischer Belastung)
    await db.update(schema.subscriptions).set({
      status: "active", periodEnd: addDays(now, RENEWAL_DAYS), payrexxTokenTxId: token, remindedFor: null,
    }).where(eq(schema.subscriptions.id, sub.id));
    if (listing.status === "paused" || listing.status === "expired") {
      await db.update(schema.listings).set({ status: "online" }).where(eq(schema.listings.id, listing.id));
    }
  }

  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, listing.ownerId)).limit(1);
  if (owner) {
    await sendMail({
      to: owner.email,
      subject: `Zahlungsbestätigung ${listingNo(listing.id)}`,
      heading: "Vielen Dank für Ihre Zahlung",
      paragraphs: [
        `Wir haben ${chf(p.amountRappen / 100)} für das Paket ${PLANS[plan].name} zu Ihrem Angebot «${listing.title}» erhalten.`,
        p.kind === "initial"
          ? "Wir prüfen Ihre Angaben und den Handelsregistereintrag jetzt persönlich – in der Regel innerhalb eines Werktags. Die Laufzeit beginnt mit der Freischaltung."
          : `Das Paket verlängert sich danach automatisch um jeweils ${RENEWAL_DAYS} Tage für ${chf(PLANS[plan].renewal)}, bis Sie kündigen oder pausieren.`,
      ],
      cta: { label: "Zu meinen Angeboten", url: `${appUrl()}/konto` },
    });
  }
}

/* ---------- Freischaltung ---------- */
export async function approveListing(listingId: number) {
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, listingId)).limit(1);
  if (!listing || listing.status !== "in_review") return;
  const sub = await getSubscription(listingId);
  const now = new Date();
  await db.update(schema.listings).set({ status: "online", publishedAt: listing.publishedAt ?? now, rejectionReason: null })
    .where(eq(schema.listings.id, listingId));
  if (sub && !sub.periodEnd) {
    await db.update(schema.subscriptions).set({ status: "active", periodEnd: addDays(now, FIRST_PERIOD_DAYS) })
      .where(eq(schema.subscriptions.id, sub.id));
  }
  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, listing.ownerId)).limit(1);
  const end = sub?.periodEnd ?? addDays(now, FIRST_PERIOD_DAYS);
  if (owner) await sendMail({
    to: owner.email,
    subject: `Ihr Angebot ist online: ${listingNo(listing.id)}`,
    heading: "Ihr Angebot ist online",
    paragraphs: [
      `«${listing.title}» ist geprüft und ab sofort auf SwissOwners sichtbar.`,
      listing.plan === "start"
        ? `Ihr Startangebot läuft kostenlos bis ${date(end)}. Wir erinnern Sie ${REMIND_START_DAYS} Tage vorher; danach wählen Sie ein Paket oder das Angebot endet automatisch.`
        : `Die erste Laufzeit dauert bis ${date(end)}. Danach verlängert sich das Paket automatisch um ${RENEWAL_DAYS} Tage, bis Sie kündigen oder pausieren.`,
    ],
    cta: { label: "Angebot ansehen", url: `${appUrl()}/inserate/${listingNo(listing.id)}` },
  });
}

export async function rejectListing(listingId: number, reason: string) {
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, listingId)).limit(1);
  if (!listing) return;
  await db.update(schema.listings).set({ status: "rejected", rejectionReason: reason }).where(eq(schema.listings.id, listingId));
  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, listing.ownerId)).limit(1);
  if (owner) await sendMail({
    to: owner.email,
    subject: `Ihr Angebot braucht eine Anpassung: ${listingNo(listing.id)}`,
    heading: "Ihr Angebot konnte noch nicht freigeschaltet werden",
    paragraphs: [`«${listing.title}»`, `Grund: ${reason}`, "Sie können das Angebot in «Mein Bereich» anpassen und erneut zur Prüfung einreichen."],
    cta: { label: "Angebot bearbeiten", url: `${appUrl()}/konto/inserate/${listing.id}/bearbeiten` },
  });
}

/* ---------- Aktionen der Inserenten ---------- */
export async function pauseListing(listing: Listing) {
  const sub = await getSubscription(listing.id);
  if (!sub || listing.status !== "online" || sub.status !== "active" || !sub.periodEnd || listing.plan === "start") return false;
  const remaining = Math.max(1, Math.ceil((sub.periodEnd.getTime() - Date.now()) / DAY));
  await db.update(schema.subscriptions).set({ status: "paused", pausedAt: new Date(), pausedRemainingDays: remaining })
    .where(eq(schema.subscriptions.id, sub.id));
  await db.update(schema.listings).set({ status: "paused" }).where(eq(schema.listings.id, listing.id));
  return true;
}

export async function resumeListing(listing: Listing) {
  const sub = await getSubscription(listing.id);
  if (!sub) return false;
  if (sub.status === "paused" && listing.status === "paused") {
    await db.update(schema.subscriptions).set({
      status: "active", periodEnd: addDays(new Date(), sub.pausedRemainingDays ?? 1), pausedAt: null, pausedRemainingDays: null, remindedFor: null,
    }).where(eq(schema.subscriptions.id, sub.id));
    await db.update(schema.listings).set({ status: "online" }).where(eq(schema.listings.id, listing.id));
    return true;
  }
  if (sub.cancelAtPeriodEnd && sub.status === "active") {
    await db.update(schema.subscriptions).set({ cancelAtPeriodEnd: false }).where(eq(schema.subscriptions.id, sub.id));
    return true;
  }
  return false;
}

export async function cancelListing(listing: Listing) {
  const sub = await getSubscription(listing.id);
  if (!sub) return false;
  if (sub.status === "paused") return endListing(listing, "expired");
  await db.update(schema.subscriptions).set({ cancelAtPeriodEnd: true }).where(eq(schema.subscriptions.id, sub.id));
  return true;
}

export async function endListing(listing: Listing, status: "sold" | "expired") {
  await db.update(schema.subscriptions).set({ status: "ended", cancelAtPeriodEnd: false }).where(eq(schema.subscriptions.listingId, listing.id));
  await db.update(schema.listings).set({ status }).where(eq(schema.listings.id, listing.id));
  return true;
}

/* ---------- Täglicher Job: Erinnerungen, Abläufe, Verlängerungen ---------- */
export async function runDaily() {
  const now = new Date();
  const log: string[] = [];
  const subs = await db
    .select({ sub: schema.subscriptions, listing: schema.listings, owner: schema.users })
    .from(schema.subscriptions)
    .innerJoin(schema.listings, eq(schema.listings.id, schema.subscriptions.listingId))
    .innerJoin(schema.users, eq(schema.users.id, schema.listings.ownerId))
    .where(inArray(schema.subscriptions.status, ["active", "paused"]));

  for (const { sub, listing, owner } of subs) {
    const no = listingNo(listing.id);
    try {
      // Pause zu lange → Angebot endet
      if (sub.status === "paused") {
        if (sub.pausedAt && now.getTime() - sub.pausedAt.getTime() > MAX_PAUSE_DAYS * DAY) {
          await endListing(listing, "expired");
          await sendMail({ to: owner.email, subject: `Angebot beendet: ${no}`, heading: "Ihr pausiertes Angebot ist beendet",
            paragraphs: [`«${listing.title}» war länger als ${MAX_PAUSE_DAYS} Tage pausiert und ist jetzt beendet. Es wurde nichts belastet.`],
            cta: { label: "Mein Bereich", url: `${appUrl()}/konto` } });
          log.push(`${no}: Pause abgelaufen`);
        }
        continue;
      }
      if (!sub.periodEnd) continue;
      const msLeft = sub.periodEnd.getTime() - now.getTime();
      const willEnd = listing.plan === "start" || sub.cancelAtPeriodEnd;

      // Erinnerungen
      const remindDays = listing.plan === "start" ? REMIND_START_DAYS : REMIND_RENEWAL_DAYS;
      const alreadyReminded = sub.remindedFor && sub.remindedFor.getTime() === sub.periodEnd.getTime();
      if (msLeft > 0 && msLeft <= remindDays * DAY && !alreadyReminded && !(sub.cancelAtPeriodEnd && listing.plan !== "start")) {
        const plan = listing.plan as Plan;
        await sendMail({
          to: owner.email,
          subject: listing.plan === "start" ? `Ihr Startangebot endet am ${date(sub.periodEnd)}` : `Verlängerung am ${date(sub.periodEnd)}: ${no}`,
          heading: listing.plan === "start" ? "Ihr Startangebot endet bald" : "Ihr Paket verlängert sich bald",
          paragraphs: listing.plan === "start"
            ? [`Das kostenlose Startangebot für «${listing.title}» endet am ${date(sub.periodEnd)}.`, "Wählen Sie ein Paket, damit Ihr Angebot online bleibt. Ohne Paket endet es automatisch – es entstehen keine Kosten."]
            : [`Ihr Paket ${planName(plan)} für «${listing.title}» verlängert sich am ${date(sub.periodEnd)} automatisch um ${RENEWAL_DAYS} Tage für ${chf(PLANS[plan as PaidPlan].renewal)}.`, "Sie können jederzeit in «Mein Bereich» kündigen oder pausieren."],
          cta: { label: listing.plan === "start" ? "Paket wählen" : "Mein Bereich", url: `${appUrl()}/konto` },
        });
        await db.update(schema.subscriptions).set({ remindedFor: sub.periodEnd }).where(eq(schema.subscriptions.id, sub.id));
        log.push(`${no}: Erinnerung`);
      }

      if (msLeft > 0) continue;

      // Laufzeit vorbei
      if (willEnd) {
        await endListing(listing, "expired");
        await sendMail({ to: owner.email, subject: `Angebot beendet: ${no}`, heading: "Ihr Angebot ist beendet",
          paragraphs: [`Die Laufzeit von «${listing.title}» ist abgelaufen. Sie können das Angebot in «Mein Bereich» mit einem Paket wieder aktivieren.`],
          cta: { label: "Mein Bereich", url: `${appUrl()}/konto` } });
        log.push(`${no}: beendet`);
        continue;
      }

      // Automatische Verlängerung
      const plan = listing.plan as PaidPlan;
      const amount = PLANS[plan].renewal * 100;
      const reference = `SWO-${listing.id}-R${randomBytes(3).toString("hex")}`;
      const [ins] = await db.insert(schema.payments).values({
        reference, listingId: listing.id, userId: owner.id, kind: "renewal", plan, amountRappen: amount,
      }).$returningId();
      let ok = false;
      if (sub.payrexxTokenTxId && px.isConfigured()) {
        try {
          const tx = await px.chargeToken(sub.payrexxTokenTxId, amount, `SwissOwners ${no} · Verlängerung ${RENEWAL_DAYS} Tage`, reference);
          ok = tx.status === "confirmed" || tx.status === "authorized" || tx.status === "waiting";
          await db.update(schema.payments).set({ payrexxTxId: tx.id }).where(eq(schema.payments.id, ins.id));
        } catch (err) {
          console.error("[billing] Belastung fehlgeschlagen", no, err);
        }
      }
      if (ok) {
        await db.update(schema.payments).set({ status: "paid", paidAt: now }).where(eq(schema.payments.id, ins.id));
        await db.update(schema.subscriptions).set({ periodEnd: addDays(sub.periodEnd, RENEWAL_DAYS), remindedFor: null })
          .where(eq(schema.subscriptions.id, sub.id));
        await sendMail({ to: owner.email, subject: `Zahlungsbestätigung Verlängerung ${no}`, heading: "Ihr Paket wurde verlängert",
          paragraphs: [`Wir haben ${chf(amount / 100)} für weitere ${RENEWAL_DAYS} Tage belastet. «${listing.title}» bleibt bis ${date(addDays(sub.periodEnd, RENEWAL_DAYS))} online.`] });
        log.push(`${no}: verlängert`);
      } else {
        await db.update(schema.payments).set({ status: "failed" }).where(eq(schema.payments.id, ins.id));
        await db.update(schema.subscriptions).set({ status: "past_due" }).where(eq(schema.subscriptions.id, sub.id));
        await db.update(schema.listings).set({ status: "paused" }).where(eq(schema.listings.id, listing.id));
        await sendMail({ to: owner.email, subject: `Zahlung fehlgeschlagen: ${no}`, heading: "Die automatische Verlängerung hat nicht geklappt",
          paragraphs: [`Wir konnten ${chf(amount / 100)} für «${listing.title}» nicht belasten. Das Angebot ist vorübergehend offline.`, "Bezahlen Sie in «Mein Bereich», dann ist es sofort wieder online."],
          cta: { label: "Jetzt bezahlen", url: `${appUrl()}/konto` } });
        log.push(`${no}: Belastung fehlgeschlagen`);
      }
    } catch (err) {
      console.error("[billing] Fehler bei", no, err);
      log.push(`${no}: Fehler`);
    }
  }

  // Offene Zahlungen älter als 2 Tage verwerfen
  await db.update(schema.payments).set({ status: "cancelled" })
    .where(and(eq(schema.payments.status, "open"), lte(schema.payments.createdAt, new Date(now.getTime() - 2 * DAY))));
  // Abgelaufene Sessions löschen
  await db.delete(schema.sessions).where(lte(schema.sessions.expiresAt, now));

  return log;
}

