import Link from "next/link";
import { RowCard } from "@/components/ListingCards";
import { Arrow, Info } from "@/components/Icons";
import { orgBadges } from "@/lib/orgs";
import { parseFilters, searchListings } from "@/lib/listings";
import { startSlotsLeft } from "@/lib/billing";

export const metadata = {
  title: "Finanzierung finden",
  description: "Eigenkapital für Schweizer Startups und KMU: Kapitalgesuch inserieren, Investoren mit VR-Erfahrung, Business Angels, VC und Startup-Förderer finden – ohne Provision.",
};
export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [{ rows, total }, left] = await Promise.all([
    searchListings({ ...parseFilters({ typ: "cap", sort: "neu" }) }).catch(() => ({ rows: [], total: 0 })),
    startSlotsLeft().catch(() => 0),
  ]);
  const top = rows.slice(0, 3);
  const orgs = await orgBadges(top.map((l) => l.orgId)).catch(() => ({} as Awaited<ReturnType<typeof orgBadges>>));
  const ways = [
    { n: "1", title: "Kapitalgesuch inserieren", text: "Beschreiben Sie Ihre Firma, den gesuchten Betrag und die Bewertung. Der Firmenname bleibt verborgen, bis Investoren eine Vertraulichkeitserklärung unterzeichnen.", cta: "Kapitalgesuch erfassen", href: "/inserat-aufgeben?typ=cap", note: left > 0 ? "Startangebot: 60 Tage kostenlos" : "Fixe Gebühr, keine Provision", main: true },
    { n: "2", title: "Investoren mit VR-Erfahrung", text: "Erfahrene Verwaltungsrätinnen und Verwaltungsräte, die sich auch finanziell beteiligen – Kapital und Know-how in einem.", cta: "Investoren ansehen", href: "/verwaltungsraete?ansicht=profile&investor=1", note: "Direkt kontaktieren" },
    { n: "3", title: "Business Angels, VC und Förderer", text: "Venture-Capital-Firmen, Angel-Netzwerke, Inkubatoren und öffentliche Startup-Förderung im Partnerverzeichnis.", cta: "Partner finden", href: "/partner?gruppe=startup", note: "Viele inserieren auch für ihre Startups" },
  ];
  return (
    <>
      <section className="hero-sec">
        <div className="wrap stack" style={{ gap: 14 }}>
          <p className="eyebrow">Finanzieren</p>
          <h1 className="h1">Eigenkapital für Ihre Firma finden</h1>
          <p className="lead muted" style={{ maxWidth: "60ch" }}>Startups und KMU suchen auf SwissOwners Investoren für eine Kapitalerhöhung – direkt, vertraulich und ohne Provision.</p>
        </div>
      </section>
      <section>
        <div className="wrap stack" style={{ gap: 24 }}>
          <div className="grid g3">
            {ways.map((w) => (
              <div key={w.n} className="entry" style={{ borderTop: `4px solid ${w.main ? "var(--red)" : "var(--accent)"}` }}>
                <span className="num">{w.n}</span>
                <h2 className="h3">{w.title}</h2>
                <p className="muted" style={{ flex: 1 }}>{w.text}</p>
                <p className="small" style={{ fontWeight: 600 }}>{w.note}</p>
                <Link className={w.main ? "btn btn-red" : "btn btn-line"} href={w.href} style={{ alignSelf: "flex-start" }}>{w.cta}</Link>
              </div>
            ))}
          </div>
          <div className="notice neutral small"><Info /><span>Kapitalgesuche dürfen nur von der Firma selbst (Verwaltungsrat oder Geschäftsführung) oder in ihrem Auftrag aufgegeben werden. Für öffentliche Angebote von Beteiligungen können Prospektpflichten bestehen; dafür sind Inserierende verantwortlich.</span></div>
        </div>
      </section>
      {top.length > 0 && (
        <section className="soft">
          <div className="wrap stack" style={{ gap: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
              <h2 className="h2">Aktuelle Kapitalgesuche</h2>
              <Link className="link" href="/inserate?typ=cap">Alle {total} ansehen <Arrow /></Link>
            </div>
            <div className="list-rows">{top.map((l) => <RowCard key={l.id} l={l} org={l.orgId && orgs[l.orgId]?.online ? orgs[l.orgId] : undefined} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
