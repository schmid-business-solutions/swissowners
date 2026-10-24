import Link from "next/link";
import HomeSearch from "@/components/HomeSearch";
import { Arrow, Home, Lock, Shield, Star, Tag } from "@/components/Icons";
import { PremCard, RowCard } from "@/components/ListingCards";
import { countPublic, latestListings, premiumListings } from "@/lib/listings";
import { startSlotsLeft } from "@/lib/billing";
import { PLANS, startOffer } from "@/lib/plans";
import { chf, date } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [prem, latest, total, left] = await Promise.all([premiumListings(3), latestListings(6), countPublic(), startSlotsLeft()]);
  const { slots, until } = startOffer();
  const minRenewal = Math.min(...Object.values(PLANS).map((p) => p.renewal));

  return (
    <>
      <section className="hero-sec">
        <div className="wrap hero hero-c">
          <div className="hero-main">
            {left > 0 && (
              <Link className="start-ribbon" href="/inserat-aufgeben">
                <span className="sr-tag">Startangebot</span>
                <span>Die ersten {slots} Angebote 60 Tage gratis · noch <b>{left} Plätze</b></span>
                <Arrow />
              </Link>
            )}
            <p className="eyebrow">Der Marktplatz für nicht kotierte Firmenanteile</p>
            <h1 className="h1 hero-title"><span>Schweizer Firmenanteile kaufen,</span> <span>verkaufen, finanzieren.</span></h1>
            <p className="lead">Beteiligungen an KMU und Startups inserieren und finden – oder Eigenkapital für Ihre Firma suchen. Direkt verhandeln, ohne Provision.</p>
            <HomeSearch />
            <p className="small muted">Anonym inserieren · Firmenname erst nach digitaler Vertraulichkeitserklärung · keine Provision</p>
          </div>
        </div>
      </section>

      <section className="soft" style={{ paddingBlock: 28 }}>
        <div className="wrap">
          <div className="trust">
          <div><Shield /><span><b>Geprüfte Angebote</b><span className="small muted">Abgleich mit dem Handelsregister vor der Freischaltung</span></span></div>
          <div><Lock size={26} color="var(--red)" /><span><b>Diskret und anonym</b><span className="small muted">Firmenname erst nach Vertraulichkeitserklärung</span></span></div>
          <div><Tag /><span><b>Fixe Gebühren</b><span className="small muted">Keine Provision auf Ihren Deal</span></span></div>
          <div><Home /><span><b>Startups und KMU</b><span className="small muted">An einem Ort, aus allen Branchen und Kantonen</span></span></div>
          </div>
        </div>
      </section>

      {prem.length > 0 && (
        <section className="prem-sec">
          <div className="wrap stack" style={{ gap: 24 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
              <div className="stack" style={{ gap: 6 }}><p className="eyebrow"><Star />Premium</p><h2 className="h2">Top-Angebote</h2></div>
              <Link className="link" href="/preise">Ihr Angebot hier platzieren <Arrow /></Link>
            </div>
            <div className="prem-grid">{prem.map((l) => <PremCard key={l.id} l={l} />)}</div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap stack" style={{ gap: 28 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
            <h2 className="h2">Neueste Angebote</h2>
            {total > 0 && <Link className="link" href="/inserate">Alle {total} Angebote ansehen <Arrow /></Link>}
          </div>
          {latest.length > 0 ? (
            <div className="list-rows">{latest.map((l) => <RowCard key={l.id} l={l} />)}</div>
          ) : (
            <div className="empty">
              <h3 className="h3">Die ersten Angebote werden gerade geprüft</h3>
              <p className="muted">Seien Sie unter den Ersten: {left > 0 ? `Angebote sind bis ${date(until)} 60 Tage kostenlos.` : "Inserieren Sie jetzt."}</p>
              <Link className="btn btn-red" href="/inserat-aufgeben">Inserat aufgeben</Link>
            </div>
          )}
        </div>
      </section>

      <section className="soft">
        <div className="wrap stack" style={{ gap: 28 }}>
          <h2 className="h2">Was möchten Sie tun?</h2>
          <div className="grid g3">
            <div className="entry" style={{ borderTop: "4px solid var(--red)" }}>
              <h3 className="h3">Anteile verkaufen</h3>
              <p className="muted" style={{ flex: 1 }}>Sie halten Aktien oder GmbH-Anteile an einer nicht kotierten Firma und möchten verkaufen.</p>
              <p className="small" style={{ fontWeight: 600 }}>{left > 0 ? "Jetzt 60 Tage gratis · danach " : ""}ab {chf(minRenewal)} pro 30 Tage</p>
              <Link className="btn btn-red" href="/inserat-aufgeben?typ=sell" style={{ alignSelf: "flex-start" }}>Verkaufsangebot erfassen</Link>
            </div>
            <div className="entry" style={{ borderTop: "4px solid var(--ink)" }}>
              <h3 className="h3">Kapital suchen</h3>
              <p className="muted" style={{ flex: 1 }}>Ihre Firma sucht Eigenkapital von Privatinvestoren und Business Angels.</p>
              <p className="small" style={{ fontWeight: 600 }}>{left > 0 ? "Jetzt 60 Tage gratis · danach " : ""}ab {chf(minRenewal)} pro 30 Tage</p>
              <Link className="btn btn-ink" href="/inserat-aufgeben?typ=cap" style={{ alignSelf: "flex-start" }}>Kapitalgesuch erfassen</Link>
            </div>
            <div className="entry" style={{ borderTop: "4px solid #9A9A95" }}>
              <h3 className="h3">Beteiligung suchen</h3>
              <p className="muted" style={{ flex: 1 }}>Durchsuchen Sie alle Angebote kostenlos und merken Sie sich die interessantesten.</p>
              <p className="small" style={{ fontWeight: 600 }}>Für Investoren kostenlos</p>
              <Link className="btn btn-line" href="/inserate" style={{ alignSelf: "flex-start" }}>Angebote durchsuchen</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="ablauf">
        <div className="wrap stack" style={{ gap: 28 }}>
          <h2 className="h2">So funktioniert&apos;s</h2>
          <ol className="howto">
            {[
              ["Inserat erfassen", "Branche, Anteil, Preisvorstellung, Vinkulierung und Vorkaufsrechte. Der Firmenname bleibt verborgen."],
              ["Prüfung", "Wir prüfen die Angaben und den Handelsregistereintrag, bevor das Angebot online geht."],
              ["Anfragen erhalten", "Interessenten unterzeichnen digital eine Vertraulichkeitserklärung und sehen dann den Firmennamen."],
              ["Direkt verhandeln", "Preis, Vertrag und Übertragung regeln Käufer und Verkäufer selbst – ohne Provision an uns."],
            ].map(([t, d], i) => (
              <li key={t}><span className="num">{i + 1}</span><h3 className="h3">{t}</h3><p className="muted">{d}</p></li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
