import Link from "next/link";
import { Cross } from "./Icons";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="ft-grid">
          <div className="ft-about">
            <div className="ft-brand">
              <span className="logo-mark"><Cross size={17} /></span>
              <span className="ft-brand-text">Swiss<i>Owners</i></span>
              <span className="beta-tag beta-tag-inv">Beta</span>
            </div>
            <p className="ft-lead">Der Marktplatz für Firmenanteile, Kapital und Verwaltungsräte in der Schweiz.</p>
            <p>Auf SwissOwners inserieren Aktionärinnen, Gesellschafter und Firmen ihre Anteile an KMU und Startups oder suchen Eigenkapital. Firmen finden Verwaltungsrätinnen und Verwaltungsräte, erfahrene Persönlichkeiten stellen sich für neue Mandate vor. M&amp;A-Berater, Treuhänder, Startup-Förderer und Investoren präsentieren sich als Partner und inserieren im Auftrag ihrer Kunden.</p>
            <p>Jeder Eintrag wird vor der Freischaltung geprüft. Firmennamen sehen Interessierte erst nach einer digitalen Vertraulichkeitserklärung. Preis, Vertrag und Mandat vereinbaren die Beteiligten direkt miteinander – zu fixen Preisen und ohne Provision.</p>
          </div>
          <nav className="ft-col" aria-label="Anbieten">
            <b>Anbieten</b>
            <Link href="/inserat-aufgeben?typ=sell">Anteile verkaufen</Link>
            <Link href="/inserat-aufgeben?typ=cap">Kapital suchen</Link>
            <Link href="/preise">Preise und Pakete</Link>
            <Link href="/verwaltungsraete/mein-profil">VR-Profil erstellen</Link>
            <Link href="/partner/neu">Partnerprofil erstellen</Link>
            <Link href="/konto">Meine Angebote</Link>
          </nav>
          <nav className="ft-col" aria-label="Investieren">
            <b>Investieren</b>
            <Link href="/inserate">Alle Angebote</Link>
            <Link href="/inserate?seg=startup">Startups</Link>
            <Link href="/inserate?seg=kmu">KMU</Link>
            <Link href="/konto?tab=merkliste">Merkliste</Link>
            <Link href="/verwaltungsraete">VR-Mandate</Link>
            <Link href="/verwaltungsraete?ansicht=profile">Verwaltungsräte finden</Link>
            <Link href="/partner">Partner finden</Link>
          </nav>
          <nav className="ft-col" aria-label="SwissOwners">
            <b>SwissOwners</b>
            <Link href="/#ablauf">So funktioniert&apos;s</Link>
            <Link href="/konto?tab=anfragen">Anfragen</Link>
            <Link href="/beta">Beta-Version</Link>
            <a href="mailto:schmidmobile@gmail.com">Kontakt</a>
          </nav>
        </div>
        <p className="ft-note">Die Inserenten sind für ihre Angaben sowie für Prospektpflichten, Vinkulierungen und Vorkaufsrechte verantwortlich. SwissOwners ist eine reine Inserateplattform, vermittelt keine Geschäfte, erbringt keine Finanzdienstleistungen und ist nicht am Abschluss beteiligt. Beteiligungen an nicht kotierten Firmen bieten Chancen, bergen aber auch Risiken bis zum Totalverlust. Prüfen Sie Unterlagen sorgfältig und ziehen Sie bei Bedarf eine Fachperson bei.</p>
        <p className="ft-legal">
          © {new Date().getFullYear()}{" "}
          <a href="https://schmidbusiness.ch/" target="_blank" rel="noopener" style={{ color: "inherit" }}>SCHMID Business Solutions</a> ·{" "}
          <Link href="/impressum" style={{ color: "inherit" }}>Impressum</Link> ·{" "}
          <Link href="/datenschutz" style={{ color: "inherit" }}>Datenschutz</Link> ·{" "}
          <Link href="/agb" style={{ color: "inherit" }}>AGB</Link>
        </p>
      </div>
    </footer>
  );
}
