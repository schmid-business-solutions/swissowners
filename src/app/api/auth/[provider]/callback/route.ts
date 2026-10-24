import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createSession, isAdminEmail } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { OAuthUserError, fetchProfile, isProvider, storeAvatar, upsertOAuthUser } from "@/lib/oauth";

export const dynamic = "force-dynamic";

/** Rückkehr von Google bzw. LinkedIn: Code prüfen, Konto finden oder anlegen, anmelden */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const q = new URL(req.url).searchParams;
  const jar = await cookies();
  const raw = jar.get("swo_oauth")?.value;
  jar.delete({ name: "swo_oauth", path: "/api/auth" });

  let saved: { p?: string; state?: string; verifier?: string; next?: string } = {};
  try { saved = raw ? JSON.parse(raw) : {}; } catch { saved = {}; }

  if (q.get("error")) redirect("/login?err=oauth-abbruch");
  if (!isProvider(provider) || saved.p !== provider || !saved.state || saved.state !== q.get("state") || !q.get("code")) {
    redirect("/login?err=oauth-sitzung");
  }

  let userId: number;
  try {
    const profile = await fetchProfile(provider, q.get("code")!, saved.verifier ?? "");
    ({ userId } = await upsertOAuthUser(provider, profile));
    await storeAvatar(userId, profile.picture);
  } catch (err) {
    if (err instanceof OAuthUserError) redirect("/login?err=oauth-email");
    console.error("[oauth]", provider, err);
    redirect("/login?err=oauth-fehler");
  }

  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (u && u.role !== "admin" && isAdminEmail(u.email)) {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, u.id));
  }
  await createSession(userId);
  const next = saved.next && saved.next.startsWith("/") && !saved.next.startsWith("//") ? saved.next : "/konto";
  redirect(next);
}
