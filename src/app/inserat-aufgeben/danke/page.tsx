import Link from "next/link";
import { Check } from "@/components/Icons";

export const metadata = { title: "Angebot eingereicht" };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ nr?: string; bezahlt?: string }> }) {
  const { nr, bezahlt } = await searchParams;
  return (
    <section>
      <div className="wrap">
        <div className="wizard">
          <div className="notice" style={{ background: "var(--ok-soft)", padding: 24 }}>
            <Check size={28} />
            <div className="stack" style={{ gap: 6 }}>
              <h1 className="h2">Angebot eingereicht</h1>
              <p>
                {bezahlt ? "Vielen Dank für Ihre Zahlung. " : "Ihr Startangebot läuft 60 Tage ab Freischaltung, kostenlos und ohne Zahlungsmittel. "}
                Wir prüfen Ihre Angaben und den Handelsregistereintrag persönlich – in der Regel innerhalb eines Werktags. Sie erhalten eine E-Mail, sobald {nr ? `Angebot ${nr}` : "Ihr Angebot"} online ist.
              </p>
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Link className="btn btn-red" href="/konto">Zu meinen Angeboten</Link>
            <Link className="btn btn-line" href="/">Zur Startseite</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
