import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runDaily } from "@/lib/billing";

/* Täglicher Abrechnungslauf. In Hostinger hPanel unter «Cron Jobs» täglich aufrufen:
   curl -fsS "https://swissowners.ch/api/cron?key=CRON_SECRET" */
export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const url = new URL(req.url);
  const given = url.searchParams.get("key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const log = await runDaily();
  return NextResponse.json({ ok: true, at: new Date().toISOString(), log });
}
export const POST = GET;
