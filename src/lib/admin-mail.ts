import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { notifyAdmin, type Fact } from "./mail";
import { appUrl, chf, date, listingNo } from "./format";
import { AKTIENKATEGORIEN, SEG_LABEL, TYPE_LABEL } from "./taxonomy";
import { planName, type Plan } from "./plans";

type Listing = typeof schema.listings.$inferSelect;

const JNU = { ja: "Ja", nein: "Nein", unklar: "Unklar" } as const;
const excerpt = (s: string, n = 450) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, "")} …` : s);

/** Admin-Benachrichtigung mit allen Eckdaten des Angebots und Direktlink zur Prüfmaske. */
export async function notifyAdminListing(listing: Listing, subject: string, note: string) {
  const [owner] = await db.select().from(schema.users).where(eq(schema.users.id, listing.ownerId)).limit(1);
  const l = listing;
  const share = AKTIENKATEGORIEN.find(([k]) => k === l.shareClass)?.[1];

  const facts: Fact[] = [
    ["Angebot", `${listingNo(l.id)} · ${TYPE_LABEL[l.type]} · ${SEG_LABEL[l.segment]}`],
    ["Paket", `${planName(l.plan as Plan)} – ${note}`],
    ["Firma", `${l.companyName} (${l.legalForm})\nUID ${l.companyUid}`],
    ["Branche", `${l.branche} › ${l.sub}`],
    ["Standort", `${l.kanton} (${l.region})`],
    ["Umsatz", l.revenueClass],
  ];
  if (l.employees != null) facts.push(["Mitarbeitende", String(l.employees)]);
  if (l.foundedYear) facts.push(["Gegründet", String(l.foundedYear)]);
  if (l.phase) facts.push(["Phase", l.phase]);
  if (l.type === "sell") {
    if (l.stake) facts.push(["Anteil", l.stake]);
    if (share) facts.push(["Aktienkategorie", share]);
    facts.push(["Preisvorstellung", chf(l.amount)]);
  } else {
    facts.push(["Gesuchter Betrag", chf(l.amount)]);
    if (l.valuation) facts.push(["Pre-Money-Bewertung", chf(l.valuation)]);
    if (l.minTicket) facts.push(["Mindestbetrag", chf(l.minTicket)]);
  }
  facts.push(
    ["Vinkuliert", JNU[l.vinkuliert]],
    ["Vorkaufsrecht", JNU[l.vorkauf]],
    ["Firma informiert", l.companyInformed ? "Ja" : "Nein"],
  );
  if (owner) {
    facts.push(["Inserent", [`${owner.firstName} ${owner.lastName}`, owner.email, owner.phone].filter(Boolean).join("\n")]);
    facts.push(["Konto seit", date(owner.createdAt)]);
  }

  const url = `${appUrl()}/admin/inserate/${l.id}`;
  await notifyAdmin(subject, [`«${l.title}»`], url, {
    ctaLabel: "Angebot prüfen und freischalten",
    facts,
    after: [
      `Beschreibung:\n${excerpt(l.description)}`,
      `Grund für das Angebot:\n${excerpt(l.reason, 250)}`,
      `Handelsregister prüfen: https://www.zefix.ch/de/search/entity/list?name=${encodeURIComponent(l.companyUid)}`,
    ],
    replyTo: owner?.email,
  });
}
