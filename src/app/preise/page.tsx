import Link from "next/link";
import { Check, Info } from "@/components/Icons";
import { startSlotsLeft } from "@/lib/billing";
import { BETA_FREE_EXT, EXT_PRODUCTS, PLANS, PAID_PLANS, startOffer } from "@/lib/plans";
import { chf, date } from "@/lib/format";

export const metadata = { title: "Preise und Pakete", description: "Alle Preise von SwissOwners: Angebote für Anteile und Kapital, VR-Mandate, VR-Profile und Partnerprofile. Fixe Gebühren, keine Provision." };
export const dynamic = "force-dynamic";

type Item = { name: string; first: number; renewal: number; text: string; tag?: string; highlight?: boolean };

function PriceCard({ p, beta }: { p: Item; beta?: boolean }) {
  const free = p.first === 0 && p.renewal === 0;
  return (
    <div className={"choice price-card" + (p.highlight ? " is-hl" : "")} style={{ cursor: "default" }}>
      <span className="row" style={{ gap: 6, justifyContent: "space-between", width: "100%" }}>
        <b>{p.name}</b>
        {p.tag && <span className="chip red">{p.tag}</span>}
      </span>
      <span className="price">{free ? "Kostenlos" : chf(p.first)}</span>
      {!free && <span className="small" style={{ fontWeight: 600 }}>für die ersten 60 Tage</span>}
      {!free && <span className="small muted">danach {chf(p.renewal)} pro Monat</span>}
      <span className="small muted">{p.text}</span>
      {beta && !free && <span className="chip ok" style={{ alignSelf: "flex-start" }}><Check />Während der Beta kostenlos</span>}
    </div>
  );
}

function Category({ eyebrow, title, lead, items, beta, cta }: { eyebrow: string; title: string; lead: string; items: Item[]; beta?: boolean; cta: [string, string][] }) {
  return (
    <div className="price-cat">
      <div className="stack" style={{ gap: 6 }}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h3">{title}</h2>
        <p className="muted" style={{ maxWidth: "70ch" }}>{lead}</p>
      </div>
      <div className="choice-grid">{items.map((p) => <PriceCard key={p.name} p={p} beta={beta} />)}</div>
      <div className="row" style={{ gap: 8 }}>
        {cta.map(([label, href], i) => <Link key={href} className={i === 0 ? "btn btn-red" : "btn btn-line"} href={href}>{label}</Link>)}
      </div>
    </div>
  );
}

export default async function PricingPage() {
  const left = await startSlotsLeft().catch(() => 0);
  const { slots, until } = startOffer();
  const E = EXT_PRODUCTS;
  return (
    <section>
      <div className="wrap stack" style={{ gap: 36 }}>
        <div className="stack" style={{ gap: 10 }}>
          <p className="eyebrow">Preise und Pakete</p>
          <h1 className="h2">Fixe Gebühren. Keine Provision.</h1>
          <p className="lead" style={{ maxWidth: "62ch" }}>Erste Laufzeit 60 Tage ab Freischaltung, danach monatlich. Jederzeit kündbar oder pausierbar. Suchen, merken und anfragen ist kostenlos.</p>
        </div>

        <Category
          eyebrow="Angebote" title="Anteile verkaufen und Kapital suchen"
          lead="Für Aktionärinnen, Gesellschafter und Firmen. Der Firmenname bleibt verborgen, bis Interessierte eine Vertraulichkeitserklärung unterzeichnen."
          items={[
            ...(left > 0 ? [{ name: "Startangebot", first: 0, renewal: 0, text: `Die ersten ${slots} Angebote: 60 Tage mit allen Leistungen von Plus, kein Zahlungsmittel nötig. Noch ${left} Plätze, längstens bis ${date(until)}.`, tag: `Noch ${left} Plätze`, highlight: true }] : []),
            ...PAID_PLANS.map((p) => ({ ...PLANS[p], tag: p === "plus" ? "Beliebt" : undefined })),
          ]}
          cta={[["Inserat aufgeben", "/inserat-aufgeben"], ["Kapitalgesuch erfassen", "/inserat-aufgeben?typ=cap"]]}
        />

        <Category
          eyebrow="Verwaltungsräte" title="VR-Mandate und VR-Profile"
          lead="Firmen inserieren ein Mandat für Verwaltungsrat oder Beirat; Persönlichkeiten stellen sich mit einem Profil vor – öffentlich, nur für Angemeldete oder anonym."
          items={[E.vrMandat, E.vrBasis, E.vrPremium]} beta={BETA_FREE_EXT}
          cta={[["VR-Mandat inserieren", "/verwaltungsraete/mandat-inserieren"], ["VR-Profil erstellen", "/verwaltungsraete/mein-profil"]]}
        />

        <Category
          eyebrow="Partner" title="Für Berater, M&A, Gründungspartner, Startup-Förderer und Investoren"
          lead="Profil im Partnerverzeichnis und Inserate im Auftrag Ihrer Kunden mit dem Hinweis «Vertreten durch». Mit einem Partner-Paket inserieren Sie günstiger als einzeln."
          items={[E.partnerProfil, { ...E.partnerStarter, tag: "Für Berater" }, E.partnerPro, E.foerderung]} beta={BETA_FREE_EXT}
          cta={[["Partnerprofil erstellen", "/partner/neu"], ["Partner ansehen", "/partner"]]}
        />

        <div className="price-cat">
          <div className="stack" style={{ gap: 6 }}>
            <p className="eyebrow">Interessierte und Investoren</p>
            <h2 className="h3">Suchen, merken, anfragen: kostenlos</h2>
            <p className="muted">Alle Angebote, VR-Mandate, VR-Profile und Partner durchsuchen, Favoriten merken und Kontakt aufnehmen – ohne Gebühren und ohne Provision.</p>
          </div>
          <Link className="btn btn-line" href="/inserate" style={{ alignSelf: "flex-start" }}>Angebote durchsuchen</Link>
        </div>

        <div className="notice neutral small"><Info /><span>Preise in CHF, keine Mehrwertsteuer. Bezahlung über Payrexx (TWINT, Kreditkarte, PostFinance u. a.). Verlängerung jeweils um 30 Tage, 5 Tage vorher erinnern wir per E-Mail. VR- und Partner-Angebote sind während der Beta kostenlos; Gebühren kündigen wir mindestens 30 Tage im Voraus an.</span></div>
      </div>
    </section>
  );
}
