import "server-only";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "./db";
import { BOARD_ROLES, type BoardMandate, type BoardProfile } from "./db/schema";
import { BRANCHEN, KANTON_REGION, KAPAZITAET, PHASEN, REGIONEN, SPRACHEN, UMSATZKLASSEN, VR_SKILLS, joinList } from "./taxonomy";

const M = schema.boardMandates;
const P = schema.boardProfiles;

export const mandateNo = (id: number) => `VR-${1000 + id}`;
export const mandateIdFromNo = (no: string): number | null => {
  const m = /^(?:VR-)?(\d+)$/i.exec(no);
  if (!m) return null;
  const id = Number(m[1]) - 1000;
  return id > 0 ? id : null;
};

/* ---------- Suche ---------- */
export type BoardFilters = { view: "mandate" | "profile"; skill: string; region: string; role: string; seg: string; investor: boolean; q: string };

export function parseBoardFilters(sp: Record<string, string | string[] | undefined>): BoardFilters {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) as string | undefined;
  return {
    view: g("ansicht") === "profile" ? "profile" : "mandate",
    skill: VR_SKILLS.includes(g("kompetenz") ?? "") ? g("kompetenz")! : "all",
    region: REGIONEN.includes(g("region") ?? "") ? g("region")! : "all",
    role: (BOARD_ROLES as readonly string[]).includes(g("rolle") ?? "") ? g("rolle")! : "all",
    seg: g("seg") === "kmu" || g("seg") === "startup" ? g("seg")! : "all",
    investor: g("investor") === "1",
    q: (g("q") ?? "").trim().slice(0, 60),
  };
}

export function boardQuery(f: Partial<BoardFilters>) {
  const q = new URLSearchParams();
  if (f.view === "profile") q.set("ansicht", "profile");
  if (f.skill && f.skill !== "all") q.set("kompetenz", f.skill);
  if (f.region && f.region !== "all") q.set("region", f.region);
  if (f.role && f.role !== "all") q.set("rolle", f.role);
  if (f.seg && f.seg !== "all") q.set("seg", f.seg);
  if (f.investor) q.set("investor", "1");
  if (f.q) q.set("q", f.q);
  const s = q.toString();
  return "/verwaltungsraete" + (s ? "?" + s : "");
}

export async function searchMandates(f: BoardFilters) {
  const c: SQL[] = [eq(M.status, "online")];
  if (f.skill !== "all") c.push(like(M.skills, `%${f.skill}%`));
  if (f.region !== "all") c.push(eq(M.region, f.region));
  if (f.role !== "all") c.push(eq(M.role, f.role as (typeof BOARD_ROLES)[number]));
  if (f.seg !== "all") c.push(eq(M.segment, f.seg as "kmu" | "startup"));
  if (f.investor) c.push(eq(M.investWelcome, true));
  if (f.q) { const p = `%${f.q.replace(/[%_]/g, "")}%`; c.push(or(like(M.title, p), like(M.description, p), like(M.branche, p))!); }
  return db.select().from(M).where(and(...c)).orderBy(asc(M.isSample), desc(M.publishedAt)).limit(200);
}

export async function searchProfiles(f: BoardFilters) {
  const c: SQL[] = [eq(P.status, "online")];
  if (f.skill !== "all") c.push(like(P.skills, `%${f.skill}%`));
  if (f.region !== "all") c.push(eq(P.region, f.region));
  if (f.investor) c.push(eq(P.investor, true));
  if (f.q) { const p = `%${f.q.replace(/[%_]/g, "")}%`; c.push(or(like(P.headline, p), like(P.bio, p), like(P.skills, p), like(P.branchen, p))!); }
  return db.select().from(P).where(and(...c)).orderBy(asc(P.isSample), desc(P.publishedAt)).limit(200);
}

export async function countBoard() {
  const [[m], [p]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(M).where(eq(M.status, "online")),
    db.select({ n: sql<number>`count(*)` }).from(P).where(eq(P.status, "online")),
  ]);
  return { mandates: Number(m.n), profiles: Number(p.n) };
}

export async function getMandate(id: number): Promise<BoardMandate | undefined> {
  const [m] = await db.select().from(M).where(eq(M.id, id)).limit(1);
  return m;
}
export async function getProfile(id: number): Promise<BoardProfile | undefined> {
  const [p] = await db.select().from(P).where(eq(P.id, id)).limit(1);
  return p;
}
export async function myProfile(userId: number): Promise<BoardProfile | undefined> {
  const [p] = await db.select().from(P).where(and(eq(P.userId, userId), eq(P.isSample, false))).orderBy(desc(P.id)).limit(1);
  return p;
}

/** Passende Profile zu einem Mandat (gleiche Kompetenzen, bevorzugt gleiche Region) */
export async function matchingProfiles(m: BoardMandate, limit = 3) {
  const skills = m.skills.split(",").map((s) => s.trim()).filter(Boolean);
  if (!skills.length) return [];
  const score = sql<number>`(${sql.join(skills.map((s) => sql`(${P.skills} LIKE ${`%${s}%`})`), sql` + `)}) + (${P.region} = ${m.region})`;
  return db.select().from(P).where(and(eq(P.status, "online"), or(...skills.map((s) => like(P.skills, `%${s}%`)))))
    .orderBy(desc(score), asc(P.isSample)).limit(limit);
}

/** Passende Mandate zu einem Profil */
export async function matchingMandates(p: BoardProfile, limit = 3) {
  const skills = p.skills.split(",").map((s) => s.trim()).filter(Boolean);
  if (!skills.length) return [];
  const score = sql<number>`(${sql.join(skills.map((s) => sql`(${M.skills} LIKE ${`%${s}%`})`), sql` + `)}) + (${M.region} = ${p.region})`;
  return db.select().from(M).where(and(eq(M.status, "online"), or(...skills.map((s) => like(M.skills, `%${s}%`)))))
    .orderBy(desc(score), asc(M.isSample)).limit(limit);
}

/* ---------- Erfassen ---------- */
const pickList = (allowed: string[], label: string, min = 0, max = 99) =>
  z.array(z.string()).transform((a) => a.filter((x) => allowed.includes(x)))
    .refine((a) => a.length >= min, `${label}: bitte mindestens ${min} wählen`)
    .refine((a) => a.length <= max, `${label}: bitte höchstens ${max} wählen`);

export const profileInput = z.object({
  headline: z.string().trim().min(10, "Titel: mindestens 10 Zeichen").max(160),
  bio: z.string().trim().min(80, "Kurzporträt: mindestens 80 Zeichen").max(3000),
  experience: z.string().trim().min(40, "Werdegang: mindestens 40 Zeichen").max(3000),
  mandates: z.string().trim().max(2000).optional(),
  skills: pickList(VR_SKILLS, "Kompetenzen", 1, 6),
  branchen: pickList(BRANCHEN, "Branchen", 0, 6),
  languages: pickList(SPRACHEN, "Sprachen", 1),
  kanton: z.string().refine((v) => v in KANTON_REGION, "Bitte den Kanton wählen"),
  capacity: z.string().refine((v) => KAPAZITAET.includes(v), "Bitte die Verfügbarkeit wählen"),
  fee: z.string().trim().max(120).optional(),
  investor: z.boolean(),
  ticket: z.string().trim().max(120).optional(),
  linkedin: z.string().trim().max(200).optional().refine((v) => !v || /^(https?:\/\/)?([a-z]+\.)?linkedin\.com\//i.test(v), "LinkedIn: bitte die Profil-Adresse (linkedin.com/in/…)"),
  visibility: z.enum(["public", "members", "anonymous"]),
});

export function profileFormData(fd: FormData) {
  return {
    headline: String(fd.get("headline") ?? ""), bio: String(fd.get("bio") ?? ""), experience: String(fd.get("experience") ?? ""),
    mandates: String(fd.get("mandates") ?? ""), skills: fd.getAll("skills").map(String), branchen: fd.getAll("branchen").map(String),
    languages: fd.getAll("languages").map(String), kanton: String(fd.get("kanton") ?? ""), capacity: String(fd.get("capacity") ?? ""),
    fee: String(fd.get("fee") ?? ""), investor: fd.get("investor") === "on", ticket: String(fd.get("ticket") ?? ""),
    linkedin: String(fd.get("linkedin") ?? ""), visibility: String(fd.get("visibility") ?? "members"),
  };
}

export function toProfileValues(d: z.output<typeof profileInput>) {
  const li = d.linkedin ? (/^https?:\/\//i.test(d.linkedin) ? d.linkedin : `https://${d.linkedin}`) : null;
  return {
    headline: d.headline, bio: d.bio, experience: d.experience, mandates: d.mandates || null,
    skills: joinList(d.skills), branchen: joinList(d.branchen), languages: joinList(d.languages),
    kanton: d.kanton, region: KANTON_REGION[d.kanton], capacity: d.capacity, fee: d.fee || null,
    investor: d.investor, ticket: d.investor ? d.ticket || null : null, linkedin: li, visibility: d.visibility,
  };
}

export const mandateInput = z.object({
  role: z.enum(BOARD_ROLES, { message: "Bitte die Funktion wählen" }),
  title: z.string().trim().min(10, "Titel: mindestens 10 Zeichen").max(100, "Titel: höchstens 100 Zeichen"),
  segment: z.enum(["kmu", "startup"]),
  branche: z.string().refine((v) => BRANCHEN.includes(v), "Bitte eine Branche wählen"),
  kanton: z.string().refine((v) => v in KANTON_REGION, "Bitte den Kanton wählen"),
  companyName: z.string().trim().min(2, "Firmenname fehlt").max(200),
  companyUid: z.string().trim().regex(/^CHE[-.\s]?\d{3}[.\s]?\d{3}[.\s]?\d{3}$/i, "UID im Format CHE-123.456.789"),
  revenueClass: z.string().optional().transform((v) => (v && UMSATZKLASSEN.includes(v) ? v : null)),
  employees: z.string().optional().transform((v) => (v && /^\d{1,6}$/.test(v) ? Number(v) : null)),
  phase: z.string().optional().transform((v) => (v && PHASEN.includes(v) ? v : null)),
  skills: pickList(VR_SKILLS, "Gesuchte Kompetenzen", 1, 5),
  description: z.string().trim().min(80, "Beschreibung: mindestens 80 Zeichen").max(4000),
  effort: z.string().trim().min(3, "Bitte den Aufwand angeben").max(160),
  fee: z.string().trim().min(2, "Bitte die Entschädigung angeben (oder «nach Vereinbarung»)").max(160),
  requirements: z.string().trim().max(2000).optional(),
  languages: pickList(SPRACHEN, "Sprachen", 1),
  startAt: z.string().trim().min(2, "Bitte den Start angeben").max(80),
  investWelcome: z.boolean(),
  orgId: z.string().optional(),
});

export function mandateFormData(fd: FormData) {
  return {
    role: String(fd.get("role") ?? ""), title: String(fd.get("title") ?? ""), segment: String(fd.get("segment") ?? "kmu"),
    branche: String(fd.get("branche") ?? ""), kanton: String(fd.get("kanton") ?? ""), companyName: String(fd.get("companyName") ?? ""),
    companyUid: String(fd.get("companyUid") ?? ""), revenueClass: String(fd.get("revenueClass") ?? ""), employees: String(fd.get("employees") ?? ""),
    phase: String(fd.get("phase") ?? ""), skills: fd.getAll("skills").map(String), description: String(fd.get("description") ?? ""),
    effort: String(fd.get("effort") ?? ""), fee: String(fd.get("fee") ?? ""), requirements: String(fd.get("requirements") ?? ""),
    languages: fd.getAll("languages").map(String), startAt: String(fd.get("startAt") ?? ""), investWelcome: fd.get("investWelcome") === "on",
    orgId: String(fd.get("orgId") ?? ""),
  };
}

export function toMandateValues(d: z.output<typeof mandateInput>) {
  const uid = d.companyUid.replace(/\D/g, "");
  return {
    role: d.role, title: d.title, segment: d.segment, branche: d.branche, kanton: d.kanton, region: KANTON_REGION[d.kanton],
    companyName: d.companyName, companyUid: `CHE-${uid.slice(0, 3)}.${uid.slice(3, 6)}.${uid.slice(6, 9)}`,
    revenueClass: d.revenueClass, employees: d.employees, phase: d.segment === "startup" ? d.phase : null,
    skills: joinList(d.skills), description: d.description, effort: d.effort, fee: d.fee, requirements: d.requirements || null,
    languages: joinList(d.languages), startAt: d.startAt, investWelcome: d.investWelcome,
  };
}

export const personInitials = (name: string) =>
  name.replace(/\b(Dr\.|Prof\.|lic\.|oec\.|iur\.)\s*/gi, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "VR";
