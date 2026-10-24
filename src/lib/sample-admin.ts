import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { SAMPLE_LISTINGS } from "./samples";
import { KANTON_REGION } from "./taxonomy";

/* Musterangebote: fiktive Angebote aus dem Prototyp, damit die Plattform in der Startphase belebt wirkt.
   Sie gehören einem System-Konto ohne Passwort (Anmeldung nicht möglich), sind überall als «Musterangebot»
   gekennzeichnet und nehmen keine Anfragen an. */

const SAMPLE_OWNER_EMAIL = "musterangebote@swissowners.ch";
const DAY = 86_400_000;

async function sampleOwnerId(): Promise<number> {
  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, SAMPLE_OWNER_EMAIL)).limit(1);
  if (u) return u.id;
  const [ins] = await db.insert(schema.users).values({
    email: SAMPLE_OWNER_EMAIL, passwordHash: null, firstName: "SwissOwners", lastName: "Musterangebote", emailVerifiedAt: new Date(),
  }).$returningId();
  return ins.id;
}

export async function countSamples(): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(schema.listings).where(eq(schema.listings.isSample, true));
  return Number(r?.n ?? 0);
}

/** Legt alle Musterangebote an, sofern noch keine vorhanden sind. Gibt die Anzahl neu angelegter zurück. */
export async function createSamples(): Promise<number> {
  if ((await countSamples()) > 0) return 0;
  const ownerId = await sampleOwnerId();
  const now = Date.now();
  const rows = SAMPLE_LISTINGS.map((s) => ({
    ownerId,
    isSample: true,
    status: "online" as const,
    plan: s.plan,
    type: s.type,
    segment: s.segment,
    title: s.title,
    description: s.description,
    reason: s.reason,
    companyName: "Musterfirma (fiktiv)",
    companyUid: "CHE-000.000.000",
    branche: s.branche,
    sub: s.sub,
    kanton: s.kanton,
    region: KANTON_REGION[s.kanton],
    legalForm: s.legalForm,
    revenueClass: s.revenueClass,
    employees: s.employees,
    foundedYear: s.foundedYear,
    phase: s.phase,
    shareClass: s.shareClass,
    stake: s.stake,
    amount: s.amount,
    valuation: s.valuation,
    minTicket: s.minTicket,
    vinkuliert: s.vinkuliert,
    vorkauf: s.vorkauf,
    companyInformed: s.companyInformed,
    views: s.views,
    publishedAt: new Date(now - s.daysAgo * DAY),
  }));
  await db.insert(schema.listings).values(rows);
  return rows.length;
}

/** Löscht ein bestimmtes Musterangebot (nur Muster, nie echte Angebote). */
export async function deleteSample(id: number): Promise<boolean> {
  const res = await db.delete(schema.listings).where(and(eq(schema.listings.id, id), eq(schema.listings.isSample, true)));
  return ((res as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0) > 0;
}

/** Löscht das älteste Musterangebot – für «pro echtes Angebot ein Muster weniger». */
export async function deleteOldestSample(): Promise<boolean> {
  const [s] = await db.select({ id: schema.listings.id }).from(schema.listings)
    .where(eq(schema.listings.isSample, true)).orderBy(asc(schema.listings.publishedAt)).limit(1);
  return s ? deleteSample(s.id) : false;
}

export async function deleteAllSamples(): Promise<number> {
  const res = await db.delete(schema.listings).where(eq(schema.listings.isSample, true));
  return (res as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0;
}
