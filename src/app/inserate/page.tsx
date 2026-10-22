import Link from "next/link";
import { FilterForm, SegSwitch, SortSelect } from "@/components/Filters";
import { RowCard } from "@/components/ListingCards";
import { facets, filtersToQuery, PAGE_SIZE, parseFilters, searchListings } from "@/lib/listings";

export const metadata = { title: "Angebote durchsuchen", description: "Anteile an Schweizer KMU und Startups: Verkaufsangebote und Kapitalgesuche aus allen Branchen und Kantonen." };
export const dynamic = "force-dynamic";

export default async function ListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = parseFilters(await searchParams);
  const [{ rows, total }, fc] = await Promise.all([searchListings(f), facets(f)]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ff = { seg: f.seg, type: f.type, branche: f.branche, sub: f.sub, region: f.region, betrag: f.betrag, sort: f.sort };

  return (
    <section className="list-sec">
      <div className="wrap stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h2">Angebote durchsuchen</h1>
          <p className="muted">Verkaufsangebote und Kapitalgesuche von Schweizer KMU und Startups.</p>
        </div>
        <SegSwitch f={ff} facets={fc} />
        <div className="list-layout">
          <FilterForm f={ff} facets={fc} />
          <div className="results">
            <div className="results-head">
              <p className="small muted" aria-live="polite"><b style={{ color: "var(--ink)" }}>{total}</b> {total === 1 ? "Angebot" : "Angebote"} gefunden</p>
              <SortSelect f={ff} />
            </div>
            {rows.length ? (
              <>
                <div className="list-rows">{rows.map((l) => <RowCard key={l.id} l={l} />)}</div>
                {pages > 1 && (
                  <nav className="pager" aria-label="Seiten">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
                      p === f.page ? <span key={p} aria-current="page">{p}</span>
                        : <Link key={p} href={`/inserate${filtersToQuery({ ...f, page: p })}`}>{p}</Link>,
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="empty">
                <h2 className="h3">Keine Angebote für diese Auswahl</h2>
                <p className="muted">Erweitern Sie Region oder Betrag – oder schauen Sie bald wieder vorbei.</p>
                <Link className="btn btn-line" href="/inserate">Filter zurücksetzen</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
