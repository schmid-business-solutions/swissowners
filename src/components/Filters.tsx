"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BETRAG, BRANCHEN, REGIONEN, SORTS, subsOf } from "@/lib/taxonomy";
import { Info } from "./Icons";

type F = { seg: string; type: string; branche: string; sub: string; region: string; betrag: string; sort: string };
type Facets = { branche: Record<string, number>; sub: Record<string, number>; seg: Record<string, number> };

function toQuery(f: F) {
  const q = new URLSearchParams();
  if (f.seg !== "all") q.set("seg", f.seg);
  if (f.type !== "all") q.set("typ", f.type);
  if (f.branche !== "all") q.set("branche", f.branche);
  if (f.branche !== "all" && f.sub !== "all") q.set("sub", f.sub);
  if (f.region !== "all") q.set("region", f.region);
  if (f.betrag !== "all") q.set("betrag", f.betrag);
  if (f.sort !== "relevanz") q.set("sort", f.sort);
  const s = q.toString();
  return "/inserate" + (s ? "?" + s : "");
}

export function SegSwitch({ f, facets }: { f: F; facets: Facets }) {
  const router = useRouter();
  const total = Object.values(facets.seg).reduce((a, b) => a + b, 0);
  const n = (v: string) => (v === "all" ? total : facets.seg[v] ?? 0);
  return (
    <div className="segsw" role="group" aria-label="Firmenart">
      {([["all", "Alle"], ["startup", "Startups"], ["kmu", "KMU"]] as const).map(([v, l]) => (
        <button key={v} type="button" aria-pressed={f.seg === v} onClick={() => router.push(toQuery({ ...f, seg: v }))}>
          {l} <span style={{ opacity: 0.7, fontWeight: 500 }}>{n(v)}</span>
        </button>
      ))}
    </div>
  );
}

export function FilterForm({ f, facets }: { f: F; facets: Facets }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (patch: Partial<F>) => start(() => router.push(toQuery({ ...f, ...patch })));
  const base = Object.values(facets.branche).reduce((a, b) => a + b, 0);
  const withAds = BRANCHEN.filter((b) => (facets.branche[b] ?? 0) > 0);
  const without = BRANCHEN.filter((b) => !(facets.branche[b] ?? 0));
  const usedSubs = f.branche !== "all" ? subsOf(f.branche).filter((s) => (facets.sub[s] ?? 0) > 0) : [];
  const showSub = f.branche !== "all" && (usedSubs.length >= 2 || f.sub !== "all");
  const subTotal = Object.values(facets.sub).reduce((a, b) => a + b, 0);

  return (
    <form className="filters" aria-label="Filter" aria-busy={pending} onSubmit={(e) => e.preventDefault()}>
      <div className="filter-row">
        <label className="field">Inseratetyp
          <select value={f.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="all">Alle Inserate</option><option value="sell">Anteile verkaufen</option><option value="cap">Kapital gesucht</option>
          </select>
        </label>
        <label className="field">Branche
          <select value={f.branche} onChange={(e) => set({ branche: e.target.value, sub: "all" })}>
            <option value="all">Alle Branchen ({base})</option>
            {withAds.map((b) => <option key={b} value={b}>{b} ({facets.branche[b]})</option>)}
            {without.length > 0 && <optgroup label="Noch ohne Inserate">{without.map((b) => <option key={b} value={b}>{b}</option>)}</optgroup>}
          </select>
        </label>
        {showSub && (
          <label className="field">Unterbranche
            <select value={f.sub} onChange={(e) => set({ sub: e.target.value })}>
              <option value="all">Alle in {f.branche} ({subTotal})</option>
              {usedSubs.map((s) => <option key={s} value={s}>{s} ({facets.sub[s]})</option>)}
            </select>
          </label>
        )}
        <label className="field">Region
          <select value={f.region} onChange={(e) => set({ region: e.target.value })}>
            <option value="all">Ganze Schweiz</option>
            {REGIONEN.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className="field">Preis oder gesuchter Betrag
          <select value={f.betrag} onChange={(e) => set({ betrag: e.target.value })}>
            {BETRAG.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="filter-foot">
        <div className="notice neutral small"><Info /><span>Der Firmenname wird nach einer digitalen Vertraulichkeitserklärung sichtbar.</span></div>
        <button type="button" className="btn btn-ghost" style={{ minHeight: 40 }} onClick={() => router.push("/inserate")}>Filter zurücksetzen</button>
      </div>
    </form>
  );
}

export function SortSelect({ f }: { f: F }) {
  const router = useRouter();
  return (
    <label className="sortsel"><span>Sortieren nach</span>
      <select value={f.sort} onChange={(e) => router.push(toQuery({ ...f, sort: e.target.value }))}>
        {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
