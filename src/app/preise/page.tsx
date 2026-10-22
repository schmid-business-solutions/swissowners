import Link from "next/link";
import { Check } from "@/components/Icons";
import { startSlotsLeft } from "@/lib/billing";
import { PLANS, PAID_PLANS, startOffer } from "@/lib/plans";
import { chf, date } from "@/lib/format";

export const metadata = { title: "Preise und Pakete" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const left = await startSlotsLeft();
  const { slots, until } = startOffer();
  return (
    <section>
      <div className="wrap stack" style={{ gap: 28 }}>
        <div className="stack" style={{ gap: 10 }}>
          <p className="eyebrow">Preise</p>
          <h1 className="h2">Fixe Inseratgebühr. Keine Provision.</h1>
          <p className="lead">Erste Laufzeit 60 Tage ab Freischaltung, danach automatische Verlängerung um jeweils 30 Tage. Jederzeit kündbar oder pausierbar. Für Interessierte ist SwissOwners kostenlos.</p>
        </div>
        {left > 0 && (
          <div className="notice"><Check size={22} /><span><b>Startangebot:</b> Die ersten {slots} Inserate laufen 60 Tage kostenlos mit allen Leistungen von Plus – noch {left} Plätze, längstens bis {date(until)}. Kein Zahlungsmittel nötig.</span></div>
        )}
        <div className="choice-grid">
          {PAID_PLANS.map((p) => (
            <div key={p} className="choice" style={{ cursor: "default" }}>
              <b>{PLANS[p].name}</b>
              <span className="price">{chf(PLANS[p].first)}</span>
              <span className="small" style={{ fontWeight: 600 }}>für die ersten 60 Tage</span>
              <span className="small muted">danach {chf(PLANS[p].renewal)} pro 30 Tage</span>
              <span className="small muted">{PLANS[p].text}</span>
            </div>
          ))}
        </div>
        <p className="small muted">Preise in CHF inkl. 8,1 % MWST. Bezahlung über Payrexx (TWINT, Kreditkarte, PostFinance u. a.).</p>
        <Link className="btn btn-red" href="/inserat-aufgeben" style={{ alignSelf: "flex-start" }}>Inserat aufgeben</Link>
      </div>
    </section>
  );
}
