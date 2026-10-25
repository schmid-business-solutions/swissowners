import Link from "next/link";
import { getUser } from "@/lib/auth";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Kontakt",
  description: "Fragen, Fehler, Ideen, Feedback oder eine Partnerschaft: Schreiben Sie uns – ein Mensch aus dem SwissOwners-Team antwortet persönlich.",
};
export const dynamic = "force-dynamic";

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ thema?: string }> }) {
  const [{ thema }, user] = await Promise.all([searchParams, getUser().catch(() => null)]);
  const defaults = user
    ? { name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, phone: user.phone ?? "" }
    : { name: "", email: "", phone: "" };

  return (
    <>
      <section className="hero-sec">
        <div className="wrap stack" style={{ gap: 14 }}>
          <p className="eyebrow">Kontakt</p>
          <h1 className="h1">Wie können wir helfen?</h1>
          <p className="lead muted" style={{ maxWidth: "62ch" }}>Ob Frage, Fehler, Idee oder Partnerschaft – wählen Sie ein Thema und schreiben Sie uns. Jede Nachricht liest ein Mensch aus unserem Team.</p>
        </div>
      </section>
      <section style={{ paddingTop: 8 }}>
        <div className="wrap contact-layout">
          <ContactForm initialTopic={thema} defaults={defaults} />
          <aside className="contact-aside stack">
            <div className="contact-card stack">
              <b>Persönliche Antwort</b>
              <p className="small muted">Wir antworten in der Regel innerhalb von 1 bis 2 Werktagen – von Mensch zu Mensch, ohne Chatbot.</p>
            </div>
            <div className="contact-card stack">
              <b>Direkt per E-Mail</b>
              <p className="small"><a href="mailto:office@schmidbusiness.com">office@schmidbusiness.com</a></p>
              <p className="small muted">SCHMID Business Solutions<br />Hardeggweg 2, 3612 Steffisburg</p>
            </div>
            <div className="contact-card stack">
              <b>Schnelle Antworten</b>
              <Link className="small" href="/#ablauf">So funktioniert SwissOwners</Link>
              <Link className="small" href="/preise">Preise und Pakete</Link>
              <Link className="small" href="/beta">Fragen zur Beta-Version</Link>
              <Link className="small" href="/agb">AGB</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
