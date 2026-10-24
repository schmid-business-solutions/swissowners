import "server-only";
import { and, asc, desc, eq, gt, isNotNull, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import type { Listing } from "./db/schema";
import { BRANCHEN, KANTON_REGION, PHASEN, RECHTSFORMEN, REGIONEN, UMSATZKLASSEN, subsOf } from "./taxonomy";
import { parseChf } from "./format";

/* ---------- Suche ---------- */
export type Filters = {
  seg: "all" | "kmu" | "startup";
  type: "all" | "sell" | "cap";
  branche: string; sub: string; region: string;
  betrag: "all" | "50" | "250" | "1000" | "max";
  sort: string; page: number;
};

const pick = <T extends string>(v: unknown, allowed: readonly T[], dflt: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : dflt;

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;
  const branche = BRANCHEN.includes(g("branche") ?? "") ? g("branche")! : "all";
  return {
    seg: pick(g("seg"), ["all", "kmu", "startup"], "all"),
    type: pick(g("typ"), ["all", "sell", "cap"], "all"),
    branche,
    sub: branche !== "all" && subsOf(branche).includes(g("sub") ?? "") ? g("sub")! : "all",
    region: REGIONEN.includes(g("region") ?? "") ? g("region")! : "all",
    betrag: pick(g("betrag"), ["all", "50", "250", "1000", "max"], "all"),
    sort: pick(g("sort"), ["relevanz", "neu", "betrag_auf", "betrag_ab", "views"], "relevanz"),
    page: Math.max(1, Math.min(200, Number(g("seite")) || 1)),
  };
}

export function filtersToQuery(f: Partial<Filters>): string {
  const q = new URLSearchParams();
  if (f.seg && f.seg !== "all") q.set("seg", f.seg);
  if (f.type && f.type !== "all") q.set("typ", f.type);
  if (f.branche && f.branche !== "all") q.set("branche", f.branche);
  if (f.sub && f.sub !== "all") q.set("sub", f.sub);
  if (f.region && f.region !== "all") q.set("region", f.region);
  if (f.betrag && f.betrag !== "all") q.set("betrag", f.betrag);
  if (f.sort && f.sort !== "relevanz") q.set("sort", f.sort);
  if (f.page && f.page > 1) q.set("seite", String(f.page));
  const s = q.toString();
  return s ? "?" + s : "";
}

const L = schema.listings;
export const isPublic = eq(L.status, "online");

function where(f: Filters, omit: ("branche" | "seg")[] = []): SQL {
  const c: SQL[] = [isPublic];
  if (f.seg !== "all" && !omit.includes("seg")) c.push(eq(L.segment, f.seg));
  if (f.type !== "all") c.push(eq(L.type, f.type));
  if (f.branche !== "all" && !omit.includes("branche")) {
    c.push(eq(L.branche, f.branche));
    if (f.sub !== "all") c.push(eq(L.sub, f.sub));
  }
  if (f.region !== "all") c.push(eq(L.region, f.region));
  if (f.betrag !== "all") {
    c.push(isNotNull(L.amount));
    if (f.betrag === "50") c.push(lte(L.amount, 50_000));
    if (f.betrag === "250") c.push(and(gt(L.amount, 50_000), lte(L.amount, 250_000))!);
    if (f.betrag === "1000") c.push(and(gt(L.amount, 250_000), lte(L.amount, 1_000_000))!);
    if (f.betrag === "max") c.push(gt(L.amount, 1_000_000));
  }
  return and(...c)!;
}

const planRankSql = sql`CASE ${L.plan} WHEN 'premium' THEN 3 WHEN 'plus' THEN 2 WHEN 'start' THEN 2 ELSE 1 END`;

export const PAGE_SIZE = 12;

export async function searchListings(f: Filters) {
  // Echte Angebote stehen immer vor Musterangeboten
  const order = [asc(L.isSample), ...(
    f.sort === "neu" ? [desc(L.publishedAt)]
    : f.sort === "betrag_auf" ? [asc(sql`${L.amount} IS NULL`), asc(L.amount)]
    : f.sort === "betrag_ab" ? [asc(sql`${L.amount} IS NULL`), desc(L.amount)]
    : f.sort === "views" ? [desc(L.views)]
    : [desc(planRankSql), desc(L.publishedAt)])];
  const w = where(f);
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(L).where(w).orderBy(...order).limit(PAGE_SIZE).offset((f.page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)` }).from(L).where(w),
  ]);
  return { rows, total: Number(n) };
}

/** Facetten: Anzahl pro Branche / Unterbranche / Firmenart bei sonst gleichen Filtern */
export async function facets(f: Filters) {
  const [br, sub, seg] = await Promise.all([
    db.select({ k: L.branche, n: sql<number>`count(*)` }).from(L).where(where(f, ["branche"])).groupBy(L.branche),
    f.branche !== "all"
      ? db.select({ k: L.sub, n: sql<number>`count(*)` }).from(L).where(and(where(f, ["branche"]), eq(L.branche, f.branche))).groupBy(L.sub)
      : Promise.resolve([] as { k: string; n: number }[]),
    db.select({ k: L.segment, n: sql<number>`count(*)` }).from(L).where(where(f, ["seg"])).groupBy(L.segment),
  ]);
  const toMap = (r: { k: string; n: number }[]) => Object.fromEntries(r.map((x) => [x.k, Number(x.n)]));
  return { branche: toMap(br), sub: toMap(sub), seg: toMap(seg) };
}

export async function premiumListings(limit = 3) {
  return db.select().from(L).where(and(isPublic, eq(L.plan, "premium"))).orderBy(asc(L.isSample), sql`RAND()`).limit(limit);
}

export async function latestListings(limit = 6) {
  return db.select().from(L).where(and(isPublic, or(isNull(L.plan), sql`${L.plan} <> 'premium'`))).orderBy(asc(L.isSample), desc(L.publishedAt)).limit(limit);
}

export async function countPublic() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(L).where(isPublic);
  return Number(n);
}

export async function getListing(id: number): Promise<Listing | undefined> {
  const [l] = await db.select().from(L).where(eq(L.id, id)).limit(1);
  return l;
}

/* ---------- Erfassen / Bearbeiten ---------- */
const yesNo = z.enum(["ja", "nein", "unklar"]);
const chfField = (label: string, required: boolean) =>
  z.string().optional().transform((v, ctx) => {
    const n = parseChf(v);
    if (Number.isNaN(n)) { ctx.addIssue({ code: "custom", message: `${label}: bitte eine Zahl in CHF eingeben` }); return z.NEVER; }
    if (required && n == null) { ctx.addIssue({ code: "custom", message: `${label} fehlt` }); return z.NEVER; }
    return n;
  });

export const listingInput = z.object({
  type: z.enum(["sell", "cap"]),
  segment: z.enum(["kmu", "startup"]),
  branche: z.string().refine((v) => BRANCHEN.includes(v), "Bitte eine Branche wählen"),
  sub: z.string().min(1, "Bitte eine Unterbranche wählen"),
  kanton: z.string().refine((v) => v in KANTON_REGION, "Bitte einen Kanton wählen"),
  legalForm: z.string().refine((v) => RECHTSFORMEN.includes(v), "Bitte eine Rechtsform wählen"),
  revenueClass: z.string().refine((v) => UMSATZKLASSEN.includes(v), "Bitte eine Umsatzklasse wählen"),
  employees: z.coerce.number().int().min(0).max(100_000).optional().or(z.literal("").transform(() => undefined)),
  foundedYear: z.coerce.number().int().min(1800, "Gründungsjahr prüfen").max(new Date().getFullYear(), "Gründungsjahr prüfen"),
  phase: z.string().optional(),
  shareClass: z.string().optional(),
  companyName: z.string().trim().min(2, "Firmenname fehlt").max(200),
  companyUid: z.string().trim().regex(/^CHE[-.\s]?\d{3}[.\s]?\d{3}[.\s]?\d{3}$/i, "UID im Format CHE-123.456.789"),
  companyInformed: z.coerce.boolean().default(false),
  title: z.string().trim().min(10, "Titel: mindestens 10 Zeichen").max(80, "Titel: höchstens 80 Zeichen"),
  stake: z.string().trim().max(60).optional(),
  amount: z.string().optional(),
  valuation: chfField("Bewertung", false),
  minTicket: chfField("Mindestbetrag", false),
  vinkuliert: yesNo,
  vorkauf: yesNo,
  description: z.string().trim().min(80, "Beschreibung: mindestens 80 Zeichen").max(4000),
  reason: z.string().trim().min(10, "Grund für das Angebot: mindestens 10 Zeichen").max(1000),
}).superRefine((d, ctx) => {
  if (!subsOf(d.branche).includes(d.sub)) ctx.addIssue({ code: "custom", path: ["sub"], message: "Unterbranche passt nicht zur Branche" });
  if (d.segment === "startup" && !PHASEN.includes(d.phase ?? "")) ctx.addIssue({ code: "custom", path: ["phase"], message: "Bitte die Phase wählen" });
  if (d.type === "sell" && !d.stake) ctx.addIssue({ code: "custom", path: ["stake"], message: "Anteil fehlt" });
  const amt = parseChf(d.amount);
  if (Number.isNaN(amt)) ctx.addIssue({ code: "custom", path: ["amount"], message: "Betrag: bitte eine Zahl in CHF eingeben" });
  if (d.type === "cap" && amt == null) ctx.addIssue({ code: "custom", path: ["amount"], message: "Gesuchter Betrag fehlt" });
});

export type ListingInput = z.input<typeof listingInput>;

export function toListingValues(d: z.output<typeof listingInput>) {
  const uid = d.companyUid.replace(/\D/g, "");
  return {
    type: d.type,
    segment: d.segment,
    branche: d.branche,
    sub: d.sub,
    kanton: d.kanton,
    region: KANTON_REGION[d.kanton],
    legalForm: d.legalForm,
    revenueClass: d.revenueClass,
    employees: typeof d.employees === "number" ? d.employees : null,
    foundedYear: d.foundedYear,
    phase: d.segment === "startup" ? d.phase ?? null : null,
    shareClass: d.segment === "startup" && d.type === "sell" && d.shareClass && d.shareClass !== "unklar" ? d.shareClass : null,
    companyName: d.companyName,
    companyUid: `CHE-${uid.slice(0, 3)}.${uid.slice(3, 6)}.${uid.slice(6, 9)}`,
    companyInformed: d.type === "cap" ? true : d.companyInformed,
    title: d.title,
    stake: d.type === "sell" ? d.stake ?? null : null,
    amount: parseChf(d.amount),
    valuation: d.type === "cap" ? d.valuation : null,
    minTicket: d.type === "cap" ? d.minTicket : null,
    vinkuliert: d.vinkuliert,
    vorkauf: d.vorkauf,
    description: d.description,
    reason: d.reason,
  };
}

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Bitte Angaben prüfen";
}
