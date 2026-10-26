"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BETRAG, BRANCHEN, ORG_GROUP_IDS, ORG_GROUPS, REGIONEN, VR_SKILLS } from "@/lib/taxonomy";
import { Search } from "./Icons";

type Tab = "sell" | "cap" | "vr" | "partner";
const TABS: [Tab, string][] = [["sell", "Anteile kaufen"], ["cap", "Kapitalgesuche"], ["vr", "Verwaltungsräte"], ["partner", "Partner"]];

export default function HomeSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sell");
  const [seg, setSeg] = useState("all");
  const [branche, setBranche] = useState("all");
  const [region, setRegion] = useState("all");
  const [betrag, setBetrag] = useState("all");
  const [view, setView] = useState("mandate");
  const [skill, setSkill] = useState("all");
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (tab === "vr") {
      if (view === "profile") p.set("ansicht", "profile");
      if (view === "investor") { p.set("ansicht", "profile"); p.set("investor", "1"); }
      if (skill !== "all") p.set("kompetenz", skill);
      if (region !== "all") p.set("region", region);
      router.push(`/verwaltungsraete${p.toString() ? `?${p}` : ""}`);
      return;
    }
    if (tab === "partner") {
      if (group !== "all") p.set("gruppe", group);
      if (region !== "all") p.set("region", region);
      if (q.trim()) p.set("q", q.trim());
      router.push(`/partner${p.toString() ? `?${p}` : ""}`);
      return;
    }
    p.set("typ", tab);
    if (seg !== "all") p.set("seg", seg);
    if (branche !== "all") p.set("branche", branche);
    if (region !== "all") p.set("region", region);
    if (betrag !== "all") p.set("betrag", betrag);
    router.push(`/inserate?${p}`);
  }

  const regionField = (
    <label className="field">Region
      <select value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="all">Ganze Schweiz</option>
        {REGIONEN.map((r) => <option key={r}>{r}</option>)}
      </select>
    </label>
  );
  const label = tab === "sell" ? "Angebote suchen" : tab === "cap" ? "Kapitalgesuche ansehen" : tab === "vr" ? (view === "mandate" ? "Mandate ansehen" : "Profile ansehen") : "Partner finden";

  return (
    <form className="search sbox" onSubmit={submit}>
      <div className="stabs" role="tablist" aria-label="Was suchen Sie?">
        {TABS.map(([v, l]) => (
          <button key={v} type="button" role="tab" className="stab" aria-selected={tab === v} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      <div className="sbody">
        <div className="search-row">
          {(tab === "sell" || tab === "cap") && (
            <>
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
              {regionField}
              <label className="field">Betrag
                <select value={betrag} onChange={(e) => setBetrag(e.target.value)}>
                  {BETRAG.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </>
          )}
          {tab === "vr" && (
            <>
              <label className="field">Ich suche
                <select value={view} onChange={(e) => setView(e.target.value)}>
                  <option value="mandate">ein VR-Mandat</option>
                  <option value="profile">eine Verwaltungsrätin / einen Verwaltungsrat</option>
                  <option value="investor">Investoren mit VR-Erfahrung</option>
                </select>
              </label>
              <label className="field">Kompetenz
                <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                  <option value="all">Alle Kompetenzen</option>
                  {VR_SKILLS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              {regionField}
            </>
          )}
          {tab === "partner" && (
            <>
              <label className="field">Art
                <select value={group} onChange={(e) => setGroup(e.target.value)}>
                  <option value="all">Alle Partner</option>
                  {ORG_GROUP_IDS.map((g) => <option key={g} value={g}>{ORG_GROUPS[g].label}</option>)}
                </select>
              </label>
              {regionField}
              <label className="field">Suche<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, Leistung, Ort" /></label>
            </>
          )}
          <button type="submit" className="btn btn-red search-go"><Search />{label}</button>
        </div>
      </div>
    </form>
  );
}
