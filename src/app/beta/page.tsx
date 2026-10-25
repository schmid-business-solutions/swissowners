import Link from "next/link";
import { BETA_LAUNCH, BETA_START, BETA_UNTIL } from "@/lib/beta";
import { Check, Info } from "@/components/Icons";

export const metadata = {
  title: "Beta-Version",
  description: "SwissOwners ist in der Beta-Phase: Wir testen die Plattform rund zwei Monate mit ersten Nutzerinnen und Nutzern und starten danach offiziell.",
};

export default function BetaPage() {
  return (
    <section>
      <div className="wrap">
        <article className="legal">
          <p className="eyebrow">Beta-Version</p>
          <h1 className="h2">SwissOwners ist in der Testphase</h1>
          <p className="lead">Wir testen die Plattform während rund zwei Monaten mit ersten Inserentinnen, Inserenten und Interessierten – bis {BETA_UNTIL}. Danach schalten wir SwissOwners offiziell auf.</p>

          <h2>Was bedeutet «Beta»?</h2>
          <p>Die Plattform ist voll funktionsfähig: Sie können ein Konto erstellen, Angebote erfassen, Angebote durchsuchen und Anfragen senden. Jedes Angebot wird wie im regulären Betrieb vor der Freischaltung geprüft. In der Beta-Phase prüfen wir zusätzlich, wie gut alles im Alltag funktioniert, und verbessern laufend.</p>

          <h2>Zeitplan</h2>
          <ul>
            <li><b>{BETA_START}:</b> Start der Beta-Version</li>
            <li><b>Bis {BETA_UNTIL}:</b> Testphase mit ersten Nutzerinnen und Nutzern, rund zwei Monate</li>
            <li><b>Voraussichtlich {BETA_LAUNCH}:</b> offizieller Start von SwissOwners</li>
          </ul>

          <h2>Was heisst das für Sie?</h2>
          <ul>
            <li><Check size={14} /> Ihre Angebote sind echt und werden persönlich geprüft – Interessenten können Sie bereits kontaktieren.</li>
            <li><Check size={14} /> Mit dem kostenlosen Startangebot inserieren Sie während der Testphase ohne Kosten.</li>
            <li><Check size={14} /> Ihr Konto und Ihre Angebote bleiben beim offiziellen Start bestehen.</li>
            <li><Info size={16} /> Funktionen, Texte und Gestaltung können sich während der Testphase noch ändern. Vereinzelt kann es zu Fehlern kommen.</li>
          </ul>

          <h2>Ihre Meinung zählt</h2>
          <p>Ist Ihnen etwas aufgefallen, fehlt eine Funktion oder hat etwas nicht funktioniert? Schreiben Sie uns – jede Rückmeldung hilft, SwissOwners besser zu machen.</p>
          <div className="row" style={{ gap: 10, marginTop: 6 }}>
            <a className="btn btn-red" href="/kontakt?thema=feedback">Feedback senden</a>
            <Link className="btn btn-line" href="/inserate">Angebote ansehen</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
