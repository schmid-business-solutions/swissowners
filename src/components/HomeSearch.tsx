"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BETRAG, BRANCHEN, REGIONEN } from "@/lib/taxonomy";
import { Search } from "./Icons";

export default function HomeSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<"sell" | "cap">("sell");
  const [seg, setSeg] = useState("all");
  const [branche, setBranche] = useState("all");
  const [region, setRegion] = useState("all");
  const [betrag, setBetrag] = useState("all");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ typ: tab });
    if (seg !== "all") q.set("seg", seg);
    if (branche !== "all") q.set("branche", branche);
    if (region !== "all") q.set("region", region);
    if (betrag !== "all") q.set("betrag", betrag);
    router.push(`/inserate?${q}`);
  }

  return (
    <form className="search sbox" onSubmit={submit}>
      <div className="stabs" role="tablist" aria-label="Was suchen Sie?">
        {([["sell", "Anteile kaufen"], ["cap", "Kapitalgesuche"]] as const).map(([v, l]) => (
          <button key={v} type="button" role="tab" className="stab" aria-selected={tab === v} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      <div className="sbody">
        <div className="search-row">
          <label className="field">Firmenart
            <select value={seg} onChange={(e) => setSeg(e.target.value)}>
              <option value="all">Alle Firmen</option><option value="startup">Startups</option><option value="kmu">KMU</option>
            </select>
          </label>
          <label className="field">Branche
            <select value={branche} onChange={(e) => setBranche(e.target.value)}>
              <option value="all">Alle Branchen</option>
              {BRANCHEN.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
          <label className="field">Region
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">Ganze Schweiz</option>
              {REGIONEN.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="field">Betrag
            <select value={betrag} onChange={(e) => setBetrag(e.target.value)}>
              {BETRAG.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <button type="submit" className="btn btn-red search-go"><Search />{tab === "sell" ? "Angebote suchen" : "Kapitalgesuche ansehen"}</button>
        </div>
      </div>
    </form>
  );
}
