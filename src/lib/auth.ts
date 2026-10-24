import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "./db";
import type { User } from "./db/schema";
import { addDays } from "./format";

const COOKIE = "swo_session";
const SESSION_DAYS = 30;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: number) {
  const token = newToken();
  const expiresAt = addDays(new Date(), SESSION_DAYS);
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
  jar.delete(COOKIE);
}

/** Aktuell angemeldete Person (pro Request gecacht) oder null */
export const getUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
});

export async function requireUser(next = "/konto"): Promise<User> {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireVerifiedUser(next = "/konto"): Promise<User> {
  const u = await requireUser(next);
  if (!u.emailVerifiedAt) redirect(`/bestaetigen?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireAdmin(next = "/admin"): Promise<User> {
  const u = await requireUser(next);
  if (u.role !== "admin") redirect("/");
  return u;
}

export { isAdminEmail } from "./env";

/* Einmal-Links für E-Mail-Bestätigung und Passwort-Reset */
export async function createAuthToken(userId: number, type: "verify" | "reset") {
  const token = newToken();
  const hours = type === "verify" ? 72 : 2;
  await db.insert(schema.authTokens).values({
    userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + hours * 3_600_000),
  });
  return token;
}

export async function consumeAuthToken(token: string, type: "verify" | "reset"): Promise<number | null> {
  const rows = await db.select().from(schema.authTokens).where(and(
    eq(schema.authTokens.tokenHash, sha256(token)),
    eq(schema.authTokens.type, type),
    isNull(schema.authTokens.usedAt),
    gt(schema.authTokens.expiresAt, new Date()),
  )).limit(1);
  const row = rows[0];
  if (!row) return null;
  await db.update(schema.authTokens).set({ usedAt: new Date() }).where(eq(schema.authTokens.id, row.id));
  return row.userId;
}
