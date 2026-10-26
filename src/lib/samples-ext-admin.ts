import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "./db";
import { KANTON_REGION } from "./taxonomy";
import { SAMPLE_LISTING_ORG, SAMPLE_MANDATES, SAMPLE_ORGS, SAMPLE_PROFILES } from "./samples-ext";

const SAMPLE_OWNER_EMAIL = "musterangebote@swissowners.ch";
const DAY = 86_400_000;

async function sampleOwnerId(): Promise<number> {
  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, SAMPLE_OWNER_EMAIL)).limit(1);
  if (u) return u.id;
  const [ins] = await db.insert(schema.users).values({ email: SAMPLE_OWNER_EMAIL, passwordHash: null, firstName: "SwissOwners", lastName: "Musterangebote", emailVerifiedAt: new Date() }).$returningId();
  return ins.id;
}

const count = async (t: typeof schema.orgs | typeof schema.boardProfiles | typeof schema.boardMandates) =>
  Number((await db.select({ n: sql<number>`count(*)` }).from(t).where(eq(t.isSample, true)))[0]?.n ?? 0);

/** Legt Musterpartner, Musterprofile und Mustermandate an – je Bereich nur, wenn dort noch keine Muster bestehen. */
export async function createExtSamples(): Promise<number> {
  const owner = await sampleOwnerId();
  const now = Date.now();
  let n = 0;
  if ((await count(schema.orgs)) === 0) {
    const existing = await db.select({ slug: schema.orgs.slug }).from(schema.orgs).where(inArray(schema.orgs.slug, SAMPLE_ORGS.map((o) => o.slug)));
    const rows = SAMPLE_ORGS.filter((o) => !existing.some((e) => e.slug === o.slug)).map((o, i) => ({
      ...o, region: KANTON_REGION[o.kanton], email: SAMPLE_OWNER_EMAIL, status: "online" as const, isSample: true, createdBy: owner,
      publishedAt: new Date(now - (20 + i) * DAY),
    }));
    if (rows.length) { await db.insert(schema.orgs).values(rows); n += rows.length; }
    const orgs = await db.select({ id: schema.orgs.id, slug: schema.orgs.slug }).from(schema.orgs).where(eq(schema.orgs.isSample, true));
    for (const [title, slug] of SAMPLE_LISTING_ORG) {
      const o = orgs.find((x) => x.slug === slug);
      if (o) await db.update(schema.listings).set({ orgId: o.id }).where(and(eq(schema.listings.isSample, true), eq(schema.listings.title, title)));
    }
  }
  if ((await count(schema.boardProfiles)) === 0) {
    await db.insert(schema.boardProfiles).values(SAMPLE_PROFILES.map((p, i) => ({
      ...p, userId: owner, region: KANTON_REGION[p.kanton], linkedin: null, status: "online" as const, isSample: true,
      views: 40 + i * 17, publishedAt: new Date(now - (2 + i * 3) * DAY),
    })));
    n += SAMPLE_PROFILES.length;
  }
  if ((await count(schema.boardMandates)) === 0) {
    const orgs = await db.select({ id: schema.orgs.id, slug: schema.orgs.slug }).from(schema.orgs);
    await db.insert(schema.boardMandates).values(SAMPLE_MANDATES.map(({ org, daysAgo, ...m }, i) => ({
      ...m, ownerId: owner, orgId: org ? orgs.find((o) => o.slug === org)?.id ?? null : null, region: KANTON_REGION[m.kanton],
      companyName: "Musterfirma (fiktiv)", companyUid: "CHE-000.000.000", status: "online" as const, isSample: true,
      views: 60 + i * 23, publishedAt: new Date(now - daysAgo * DAY),
    })));
    n += SAMPLE_MANDATES.length;
  }
  return n;
}

/** Ergänzt fehlende Musterpartner einer Art (z. B. neue Kategorie), ohne bestehende Einträge zu berühren. */
export async function addMissingSampleOrgs(kind: string): Promise<number> {
  const wanted = SAMPLE_ORGS.filter((o) => o.kind === kind);
  if (!wanted.length) return 0;
  const existing = await db.select({ slug: schema.orgs.slug }).from(schema.orgs).where(inArray(schema.orgs.slug, wanted.map((o) => o.slug)));
  const owner = await sampleOwnerId();
  const now = Date.now();
  const rows = wanted.filter((o) => !existing.some((e) => e.slug === o.slug)).map((o, i) => ({
    ...o, region: KANTON_REGION[o.kanton], email: SAMPLE_OWNER_EMAIL, status: "online" as const, isSample: true, createdBy: owner,
    publishedAt: new Date(now - (3 + i * 4) * DAY),
  }));
  if (rows.length) await db.insert(schema.orgs).values(rows);
  return rows.length;
}
