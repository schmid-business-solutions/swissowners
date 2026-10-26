import Link from "next/link";
import { OrgCard } from "@/components/BoardCards";
import SearchSwitch from "@/components/SearchSwitch";
import { orgActivity, parseOrgFilters, searchOrgs } from "@/lib/orgs";
import { ORG_GROUP_IDS, ORG_GROUPS, ORG_KIND_LABEL, REGIONEN } from "@/lib/taxonomy";

export const metadata = {
  title: "Partner finden",
  description: "M&A-Berater, Nachfolgeberater, Treuhänder, Gründungspartner, Startup-Förderer und Investoren in der Schweiz – mit ihren aktuellen Angeboten auf SwissOwners.",
};
export const dynamic = "force-dynamic";

export default async function PartnerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = parseOrgFilters(await searchParams);
  const rows = await searchOrgs(f);
  const act = await orgActivity(rows.map((o) => o.id));
  const groupLink = (g: string) => `/partner${g === "all" ? "" : `?gruppe=${g}`}`;
  return (
    <section className="list-sec">
      <div className="wrap stack" style={{ gap: 24 }}>
        <SearchSwitch current="partner" />
        <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-end" }}>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="h2">Partner finden</h1>
            <p className="muted" style={{ maxWidth: "62ch" }}>Berater für Verkauf, Kauf und Nachfolge, Gründungspartner für AG und GmbH – und Organisationen, die Startups fördern und finanzieren. Partner inserieren auch im Auftrag ihrer Kunden.</p>
          </div>
          <Link className="btn btn-line" href="/partner/neu">Partnerprofil erstellen</Link>
        </div>
        <div className="segsw" role="group" aria-label="Partnergruppe">
          {([["all", "Alle"], ...ORG_GROUP_IDS.map((g) => [g, ORG_GROUPS[g].label])] as [string, string][]).map(([g, l]) => (
            <Link key={g} href={groupLink(g)} aria-pressed={f.group === g} role="button">{l}</Link>
          ))}
        </div>
        <form className="filters filter-inline" method="get" action="/partner">
          {f.group !== "all" && <input type="hidden" name="gruppe" value={f.group} />}
          <label className="field">Art
            <select name="typ" defaultValue={f.kind}>
              <option value="all">Alle Arten</option>
              {(f.group === "all" ? ORG_GROUP_IDS.flatMap((g) => [...ORG_GROUPS[g].kinds]) : [...ORG_GROUPS[f.group].kinds]).map((k) => <option key={k} value={k}>{ORG_KIND_LABEL[k]}</option>)}
            </select>
          </label>
          <label className="field">Region
            <select name="region" defaultValue={f.region}>
              <option value="all">Ganze Schweiz</option>{REGIONEN.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="field">Suche<input name="q" defaultValue={f.q} placeholder="Name, Leistung, Ort" /></label>
          <button className="btn btn-red">Anzeigen</button>
        </form>
        <p className="small muted" aria-live="polite"><b style={{ color: "var(--ink)" }}>{rows.length}</b> {rows.length === 1 ? "Partner" : "Partner"} gefunden</p>
        {rows.length ? (
          <div className="grid g3">{rows.map((o) => <OrgCard key={o.id} o={o} active={act[o.id] ?? 0} />)}</div>
        ) : (
          <div className="empty">
            <h2 className="h3">Keine Partner für diese Auswahl</h2>
            <p className="muted">Ändern Sie die Auswahl – oder erstellen Sie selbst ein Partnerprofil.</p>
            <div className="row" style={{ gap: 8, justifyContent: "center" }}><Link className="btn btn-line" href="/partner">Filter zurücksetzen</Link><Link className="btn btn-red" href="/partner/neu">Partnerprofil erstellen</Link></div>
          </div>
        )}
      </div>
    </section>
  );
}
