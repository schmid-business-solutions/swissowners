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
            </div>
            <p className="ft-lead">Der Marktplatz für Firmenanteile in der Schweiz.</p>
            <p>Auf SwissOwners inserieren Aktionärinnen, Gesellschafter und Firmen ihre Anteile an KMU und Startups. Investorinnen und Investoren finden passende Beteiligungen aus allen Branchen und Kantonen.</p>
            <p>Jedes Angebot wird vor der Freischaltung geprüft. Den Firmennamen sehen Interessenten erst nach einer digitalen Vertraulichkeitserklärung. Preis, Vertrag und Übertragung vereinbaren Käufer und Verkäufer direkt miteinander – zu fixen Inseratepreisen und ohne Provision.</p>
          </div>
          <nav className="ft-col" aria-label="Anbieten">
            <b>Anbieten</b>
            <Link href="/inserat-aufgeben?typ=sell">Anteile verkaufen</Link>
            <Link href="/inserat-aufgeben?typ=cap">Kapital suchen</Link>
            <Link href="/preise">Preise und Pakete</Link>
            <Link href="/konto">Meine Angebote</Link>
          </nav>
          <nav className="ft-col" aria-label="Investieren">
            <b>Investieren</b>
            <Link href="/inserate">Alle Angebote</Link>
            <Link href="/inserate?seg=startup">Startups</Link>
            <Link href="/inserate?seg=kmu">KMU</Link>
            <Link href="/konto?tab=merkliste">Merkliste</Link>
          </nav>
          <nav className="ft-col" aria-label="SwissOwners">
            <b>SwissOwners</b>
            <Link href="/#ablauf">So funktioniert&apos;s</Link>
            <Link href="/konto?tab=anfragen">Anfragen</Link>
            <a href="mailto:schmidmobile@gmail.com">Kontakt</a>
          </nav>
        </div>
        <p className="ft-note">Die Inserenten sind für ihre Angaben sowie für Prospektpflichten, Vinkulierungen und Vorkaufsrechte verantwortlich. SwissOwners ist eine reine Inserateplattform, vermittelt keine Geschäfte, erbringt keine Finanzdienstleistungen und ist nicht am Abschluss beteiligt. Beteiligungen an nicht kotierten Firmen bieten Chancen, bergen aber auch Risiken bis zum Totalverlust. Prüfen Sie Unterlagen sorgfältig und ziehen Sie bei Bedarf eine Fachperson bei.</p>
        <p className="ft-legal">
          © {new Date().getFullYear()} SCHMID Business Solutions ·{" "}
          <Link href="/impressum" style={{ color: "inherit" }}>Impressum</Link> ·{" "}
          <Link href="/datenschutz" style={{ color: "inherit" }}>Datenschutz</Link> ·{" "}
          <Link href="/agb" style={{ color: "inherit" }}>AGB</Link>
        </p>
      </div>
    </footer>
  );
}
