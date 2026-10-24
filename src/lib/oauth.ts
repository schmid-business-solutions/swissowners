import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "./db";
import { envSet, isAdminEmail } from "./env";
import { appUrl } from "./format";

/* Anmeldung über Google und LinkedIn mit OpenID Connect (Authorization Code Flow).
   Der Code wird serverseitig mit dem Client-Secret eingetauscht; Name und E-Mail
   kommen vom userinfo-Endpunkt des Anbieters. */

export type Provider = "google" | "linkedin";
export const PROVIDERS: Provider[] = ["google", "linkedin"];

type Config = {
  label: string;
  authUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  pkce: boolean;
  idEnv: string;
  secretEnv: string;
};

const CONFIG: Record<Provider, Config> = {
  google: {
    label: "Google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    pkce: true,
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
  },
  linkedin: {
    label: "LinkedIn",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userinfoUrl: "https://api.linkedin.com/v2/userinfo",
    scope: "openid profile email",
    pkce: false,
    idEnv: "LINKEDIN_CLIENT_ID",
    secretEnv: "LINKEDIN_CLIENT_SECRET",
  },
};

export const isProvider = (p: string): p is Provider => (PROVIDERS as string[]).includes(p);
export const providerLabel = (p: Provider) => CONFIG[p].label;
export const providerEnabled = (p: Provider) => envSet(CONFIG[p].idEnv, CONFIG[p].secretEnv);
export const enabledProviders = () => PROVIDERS.filter(providerEnabled);
export const redirectUri = (p: Provider) => `${appUrl()}/api/auth/${p}/callback`;

const b64url = (b: Buffer) => b.toString("base64url");

export function buildAuthRequest(p: Provider) {
  const c = CONFIG[p];
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(32));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env[c.idEnv]!,
    redirect_uri: redirectUri(p),
    scope: c.scope,
    state,
  });
  if (c.pkce) {
    params.set("code_challenge", b64url(createHash("sha256").update(verifier).digest()));
    params.set("code_challenge_method", "S256");
  }
  if (p === "google") params.set("prompt", "select_account");
  return { url: `${c.authUrl}?${params}`, state, verifier };
}

export type Profile = { sub: string; email: string; emailVerified: boolean; firstName: string; lastName: string; picture?: string };

export async function fetchProfile(p: Provider, code: string, verifier: string): Promise<Profile> {
  const c = CONFIG[p];
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(p),
    client_id: process.env[c.idEnv]!,
    client_secret: process.env[c.secretEnv]!,
  });
  if (c.pkce) body.set("code_verifier", verifier);
  const tokenRes = await fetch(c.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store",
  });
  const token = (await tokenRes.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(`${c.label}: Token-Austausch fehlgeschlagen (${tokenRes.status} ${token.error ?? ""} ${token.error_description ?? ""})`.trim());
  }
  const infoRes = await fetch(c.userinfoUrl, { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
  const info = (await infoRes.json().catch(() => ({}))) as Record<string, unknown>;
  if (!infoRes.ok || typeof info.sub !== "string") throw new Error(`${c.label}: Profil konnte nicht gelesen werden (${infoRes.status})`);
  const verified = info.email_verified === true || info.email_verified === "true";
  return {
    sub: info.sub,
    email: String(info.email ?? "").trim().toLowerCase(),
    emailVerified: verified,
    firstName: String(info.given_name ?? "").trim().slice(0, 100),
    lastName: String(info.family_name ?? "").trim().slice(0, 100),
    picture: typeof info.picture === "string" && /^https:\/\//.test(info.picture) ? info.picture : undefined,
  };
}

/** Lädt das Profilbild des Anbieters einmal serverseitig und speichert es bei uns.
    So sehen Besucher es ohne Abruf bei Google/LinkedIn, und abgelaufene Bild-Links spielen keine Rolle. */
export async function storeAvatar(userId: number, pictureUrl: string | undefined) {
  if (!pictureUrl) return;
  try {
    // Google liefert per Parameter eine passende Grösse
    const url = pictureUrl.replace(/=s\d+(-c)?$/, "=s160-c");
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !/^image\/(jpeg|png|webp|gif)$/.test(mime)) return;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 400_000) return;
    const data = buf.toString("base64");
    const now = new Date();
    await db.insert(schema.userAvatars).values({ userId, mime, data, updatedAt: now })
      .onDuplicateKeyUpdate({ set: { mime, data, updatedAt: now } });
    await db.update(schema.users).set({ avatarUpdatedAt: now }).where(eq(schema.users.id, userId));
  } catch (err) {
    console.error("[oauth] Profilbild nicht gespeichert", err);
  }
}

/** Findet oder erstellt das Konto zu einem Anbieter-Profil. Gibt die User-ID zurück. */
export async function upsertOAuthUser(p: Provider, prof: Profile): Promise<{ userId: number; created: boolean }> {
  const [link] = await db.select().from(schema.oauthAccounts)
    .where(and(eq(schema.oauthAccounts.provider, p), eq(schema.oauthAccounts.providerUserId, prof.sub))).limit(1);
  if (link) return { userId: link.userId, created: false };

  if (!prof.email || !prof.emailVerified) throw new OAuthUserError("email");

  // Bestehendes Konto mit derselben (vom Anbieter bestätigten) E-Mail verknüpfen
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, prof.email)).limit(1);
  let userId: number;
  let created = false;
  if (existing) {
    userId = existing.id;
    if (!existing.emailVerifiedAt) {
      await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
    }
  } else {
    const [ins] = await db.insert(schema.users).values({
      email: prof.email,
      passwordHash: null,
      firstName: prof.firstName || prof.email.split("@")[0],
      lastName: prof.lastName || "",
      emailVerifiedAt: new Date(),
      role: isAdminEmail(prof.email) ? "admin" : "user",
    }).$returningId();
    userId = ins.id;
    created = true;
  }
  await db.insert(schema.oauthAccounts).values({ userId, provider: p, providerUserId: prof.sub, email: prof.email });
  return { userId, created };
}

export class OAuthUserError extends Error {
  constructor(public code: "email") {
    super(code);
  }
}
