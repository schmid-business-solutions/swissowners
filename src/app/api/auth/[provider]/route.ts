import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buildAuthRequest, isProvider, providerEnabled } from "@/lib/oauth";
import { allow, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/konto");

/** Startet die Anmeldung bei Google bzw. LinkedIn */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider) || !providerEnabled(provider)) redirect("/login?err=oauth-inaktiv");
  if (!allow(`oauth:${await clientIp()}`, 30, 600_000)) redirect("/login?err=oauth-limit");
  const next = safeNext(new URL(req.url).searchParams.get("next"));
  const { url, state, verifier } = buildAuthRequest(provider);
  const jar = await cookies();
  jar.set("swo_oauth", JSON.stringify({ p: provider, state, verifier, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 600,
  });
  redirect(url);
}
