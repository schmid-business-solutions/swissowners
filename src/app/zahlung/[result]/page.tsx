import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Check, Info } from "@/components/Icons";
import { confirmPayment } from "@/lib/billing";
import { db, schema } from "@/lib/db";
import { listingNo } from "@/lib/format";

export const metadata = { title: "Zahlung", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaymentResult({ params, searchParams }: { params: Promise<{ result: string }>; searchParams: Promise<{ ref?: string }> }) {
  const { result } = await params;
  const { ref = "" } = await searchParams;
  if (!["erfolg", "fehler", "abbruch"].includes(result)) notFound();
  const [p] = ref ? await db.select().from(schema.payments).where(eq(schema.payments.reference, ref)).limit(1) : [];
  if (!p) notFound();

  let status: string = p.status;
  if (result === "erfolg" && p.status === "open") {
    status = await confirmPayment(ref).catch((e) => { console.error(e); return "open"; });
  }
  const no = listingNo(p.listingId);

  if (status === "paid") {
    return (
      <section><div className="wrap"><div className="wizard">
        <div className="notice" style={{ background: "var(--ok-soft)", padding: 24 }}><Check size={28} />
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="h2">Zahlung erhalten</h1>
            <p>{p.kind === "initial"
              ? `Vielen Dank. Wir prüfen jetzt Angebot ${no} – in der Regel innerhalb eines Werktags. Die Laufzeit beginnt mit der Freischaltung.`
              : `Vielen Dank. Ihr Paket für Angebot ${no} ist aktiv.`} Eine Bestätigung ist per E-Mail unterwegs.</p>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}><Link className="btn btn-red" href="/konto">Zu meinen Angeboten</Link></div>
      </div></div></section>
    );
  }
  return (
    <section><div className="wrap"><div className="wizard">
      <div className="notice" style={{ padding: 24 }}><Info />
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h2">{result === "abbruch" ? "Zahlung abgebrochen" : status === "open" ? "Zahlung wird verarbeitet" : "Zahlung fehlgeschlagen"}</h1>
          <p>{status === "open" && result === "erfolg"
            ? "Die Bestätigung von Payrexx steht noch aus. Das dauert meist nur einige Sekunden – laden Sie die Seite neu oder schauen Sie in «Mein Bereich»."
            : "Es wurde nichts belastet. Sie können die Zahlung in «Mein Bereich» jederzeit erneut starten."}</p>
        </div>
      </div>
      <div className="row" style={{ gap: 10 }}><Link className="btn btn-red" href="/konto">Zu meinen Angeboten</Link></div>
    </div></div></section>
  );
}
