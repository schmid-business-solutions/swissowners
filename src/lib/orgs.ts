import "server-only";
import { and, asc, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import type { Org } from "./db/schema";
import { ORG_KINDS, type OrgKind } from "./db/schema";
import { BRANCHEN, KANTON_REGION, ORG_GROUPS, ORG_SERVICES, REGIONEN, SPRACHEN, joinList, type OrgGroup } from "./taxonomy";

const O = schema.orgs;

/* ---------- Verzeichnis ---------- */
export type OrgFilters = { group: "all" | OrgGroup; kind: "all" | OrgKind; region: string; q: string };

export function parseOrgFilters(sp: Record<string, string | string[] | undefined>): OrgFilters {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;
  const group = g("gruppe") === "berater" || g("gruppe") === "startup" ? (g("gruppe") as OrgGroup) : "all";
  const kind = (ORG_KINDS as readonly string[]).includes(g("typ") ?? "") ? (g("typ") as OrgKind) : "all";
  return { group, kind, region: REGIONEN.includes(g("region") ?? "") ? g("region")! : "all", q: (g("q") ?? "").trim().slice(0, 60) };
}

export async function searchOrgs(f: OrgFilters) {
  const c: SQL[] = [eq(O.status, "online")];
  if (f.kind !== "all") c.push(eq(O.kind, f.kind));
  else if (f.group !== "all") c.push(inArray(O.kind, [...ORG_GROUPS[f.group].kinds]));
  if (f.region !== "all") c.push(eq(O.region, f.region));
  if (f.q) {
    const p = `%${f.q.replace(/[%_]/g, "")}%`;
    c.push(or(like(O.name, p), like(O.tagline, p), like(O.services, p), like(O.city, p))!);
  }
  const rows = await db.select().from(O).where(and(...c)).orderBy(asc(O.isSample), desc(O.verified), asc(O.name)).limit(200);
  return rows;
}

/** Anzahl aktiver Angebote und VR-Mandate pro Partner */
export async function orgActivity(ids: number[]) {
  if (!ids.length) return {} as Record<number, number>;
  const [l, m] = await Promise.all([
    db.select({ id: schema.listings.orgId, n: sql<number>`count(*)` }).from(schema.listings)
      .where(and(inArray(schema.listings.orgId, ids), eq(schema.listings.status, "online"))).groupBy(schema.listings.orgId),
    db.select({ id: schema.boardMandates.orgId, n: sql<number>`count(*)` }).from(schema.boardMandates)
      .where(and(inArray(schema.boardMandates.orgId, ids), eq(schema.boardMandates.status, "online"))).groupBy(schema.boardMandates.orgId),
  ]);
  const r: Record<number, number> = {};
  for (const x of [...l, ...m]) if (x.id != null) r[x.id] = (r[x.id] ?? 0) + Number(x.n);
  return r;
}

export async function getOrgBySlug(slug: string): Promise<Org | undefined> {
  const [o] = await db.select().from(O).where(eq(O.slug, slug)).limit(1);
  return o;
}

export async function getOrg(id: number): Promise<Org | undefined> {
  const [o] = await db.select().from(O).where(eq(O.id, id)).limit(1);
  return o;
}

/** Name und Link der Partner zu einer Liste von Angeboten (für Badge «Vertreten durch») */
export async function orgBadges(orgIds: (number | null)[]) {
  const ids = [...new Set(orgIds.filter((x): x is number => x != null))];
  if (!ids.length) return {} as Record<number, { name: string; slug: string; online: boolean }>;
  const rows = await db.select({ id: O.id, name: O.name, slug: O.slug, status: O.status }).from(O).where(inArray(O.id, ids));
  return Object.fromEntries(rows.map((r) => [r.id, { name: r.name, slug: r.slug, online: r.status === "online" }]));
}

/* ---------- Mitgliedschaft ---------- */
export async function myOrgs(userId: number) {
  return db.select({ org: O, role: schema.orgMembers.role }).from(schema.orgMembers)
    .innerJoin(O, eq(O.id, schema.orgMembers.orgId))
    .where(eq(schema.orgMembers.userId, userId)).orderBy(asc(O.name));
}

export async function membership(orgId: number, userId: number) {
  const [m] = await db.select().from(schema.orgMembers)
    .where(and(eq(schema.orgMembers.orgId, orgId), eq(schema.orgMembers.userId, userId))).limit(1);
  return m;
}

export async function orgMembersOf(orgId: number) {
  return db.select({ m: schema.orgMembers, u: schema.users }).from(schema.orgMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.orgMembers.userId))
    .where(eq(schema.orgMembers.orgId, orgId)).orderBy(asc(schema.orgMembers.createdAt));
}

/* ---------- Erfassen ---------- */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/é|è|ê/g, "e").replace(/à|â/g, "a")
    .replace(/&/g, " und ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "partner";

export async function uniqueSlug(name: string, exceptId?: number) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const s = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db.select({ id: O.id }).from(O).where(eq(O.slug, s)).limit(1);
    if (!hit || hit.id === exceptId) return s;
  }
  return `${base}-${Date.now().toString(36)}`;
}

const url = z.string().trim().max(200).optional().transform((v) => {
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}).refine((v) => v == null || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Website: bitte eine gültige Adresse");

const pickList = (allowed: string[], label: string, min = 0) =>
  z.array(z.string()).transform((a) => a.filter((x) => allowed.includes(x))).refine((a) => a.length >= min, `${label}: bitte mindestens ${min} wählen`);

export const orgInput = z.object({
  kind: z.enum(ORG_KINDS, { message: "Bitte die Art der Organisation wählen" }),
  name: z.string().trim().min(2, "Name fehlt").max(160),
  uid: z.string().trim().optional().refine((v) => !v || /^CHE[-.\s]?\d{3}[.\s]?\d{3}[.\s]?\d{3}$/i.test(v), "UID im Format CHE-123.456.789"),
  tagline: z.string().trim().min(10, "Kurzbeschreibung: mindestens 10 Zeichen").max(160, "Kurzbeschreibung: höchstens 160 Zeichen"),
  description: z.string().trim().min(80, "Beschreibung: mindestens 80 Zeichen").max(4000),
  services: pickList(ORG_SERVICES, "Leistungen", 1),
  branchen: pickList(BRANCHEN, "Branchen"),
  focus: z.string().trim().max(200).optional(),
  kanton: z.string().refine((v) => v in KANTON_REGION, "Bitte den Kanton wählen"),
  city: z.string().trim().min(2, "Ort fehlt").max(80),
  languages: pickList(SPRACHEN, "Sprachen", 1),
  website: url,
  email: z.string().trim().email("E-Mail-Adresse prüfen").max(200),
  phone: z.string().trim().max(40).optional(),
});

export function toOrgValues(d: z.output<typeof orgInput>) {
  const uid = (d.uid ?? "").replace(/\D/g, "");
  return {
    kind: d.kind, name: d.name, tagline: d.tagline, description: d.description,
    uid: uid.length === 9 ? `CHE-${uid.slice(0, 3)}.${uid.slice(3, 6)}.${uid.slice(6, 9)}` : null,
    services: joinList(d.services), branchen: joinList(d.branchen), focus: d.focus || null,
    kanton: d.kanton, region: KANTON_REGION[d.kanton], city: d.city, languages: joinList(d.languages),
    website: d.website, email: d.email, phone: d.phone || null,
  };
}

export function orgFormData(fd: FormData) {
  return {
    kind: String(fd.get("kind") ?? ""), name: String(fd.get("name") ?? ""), uid: String(fd.get("uid") ?? ""),
    tagline: String(fd.get("tagline") ?? ""), description: String(fd.get("description") ?? ""),
    services: fd.getAll("services").map(String), branchen: fd.getAll("branchen").map(String), focus: String(fd.get("focus") ?? ""),
    kanton: String(fd.get("kanton") ?? ""), city: String(fd.get("city") ?? ""), languages: fd.getAll("languages").map(String),
    website: String(fd.get("website") ?? ""), email: String(fd.get("email") ?? ""), phone: String(fd.get("phone") ?? ""),
  };
}

export const orgInitials = (name: string) =>
  name.replace(/\b(AG|GmbH|SA|Sàrl|und|&|der|die|das)\b/gi, "").split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "P";
