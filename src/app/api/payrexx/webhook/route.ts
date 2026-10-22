import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { confirmPayment } from "@/lib/billing";
import { db, schema } from "@/lib/db";

/* Payrexx-Webhook (in Payrexx unter Webhooks eintragen: https://anteo.swiss/api/payrexx/webhook, Typ JSON oder Normal).
   Dem Inhalt wird nicht vertraut: Wir lesen nur die Referenz und fragen den Status selbst bei der Payrexx-API ab. */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) body = await req.json();
    else {
      const fd = await req.formData();
      const flat: Record<string, string> = {};
      fd.forEach((v, k) => { flat[k] = String(v); });
      body = { transaction: { referenceId: flat["transaction[referenceId]"], invoice: { referenceId: flat["transaction[invoice][referenceId]"] } } };
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const tx = (body.transaction ?? {}) as { referenceId?: string; invoice?: { referenceId?: string } };
  const ref = String(tx.referenceId || tx.invoice?.referenceId || "");
  if (!/^ANT-\d+-[a-f0-9R]+$/i.test(ref)) return NextResponse.json({ ok: true, ignored: true });
  const [p] = await db.select().from(schema.payments).where(eq(schema.payments.reference, ref)).limit(1);
  if (!p) return NextResponse.json({ ok: true, ignored: true });
  if (p.kind === "renewal") return NextResponse.json({ ok: true }); // Verlängerungen werden direkt im Abrechnungslauf verbucht
  try {
    const status = await confirmPayment(ref);
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("[webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
