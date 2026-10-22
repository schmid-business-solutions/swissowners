"use client";
import { useEffect, useState } from "react";

/* Vorschau der Header-Varianten (Weiss / Schwarz / Rot).
   Aktiv nur, wenn die Seite mit ?header=schwarz|rot|weiss aufgerufen wurde; gilt dann für diese Browser-Sitzung.
   Normale Besucher sehen nichts davon. */
const VARIANTS = [["weiss", "Weiss"], ["schwarz", "Schwarz"], ["rot", "Rot"]] as const;
type V = (typeof VARIANTS)[number][0];

export const HEADER_PREVIEW_SCRIPT = `(function(){try{var m=location.search.match(/[?&]header=(rot|schwarz|weiss)/);var v=m?m[1]:sessionStorage.getItem('swo_header');if(m)sessionStorage.setItem('swo_header',v);if(v&&v!=='weiss')document.documentElement.setAttribute('data-header',v);}catch(e){}})();`;

export default function HeaderPreview() {
  const [v, setV] = useState<V | null>(null);
  useEffect(() => {
    try { setV((sessionStorage.getItem("swo_header") as V) || null); } catch { /* ohne Speicher keine Vorschau */ }
  }, []);
  if (!v) return null;
  const pick = (n: V) => {
    setV(n);
    try { sessionStorage.setItem("swo_header", n); } catch { /* egal */ }
    if (n === "weiss") document.documentElement.removeAttribute("data-header");
    else document.documentElement.setAttribute("data-header", n);
  };
  const close = () => {
    try { sessionStorage.removeItem("swo_header"); } catch { /* egal */ }
    document.documentElement.removeAttribute("data-header");
    setV(null);
  };
  return (
    <div className="hp-bar" role="group" aria-label="Header-Variante wählen">
      <span>Header:</span>
      {VARIANTS.map(([key, label]) => (
        <button key={key} type="button" aria-pressed={v === key} onClick={() => pick(key)}>{label}</button>
      ))}
      <button type="button" className="hp-x" aria-label="Vorschau beenden" onClick={close}>×</button>
    </div>
  );
}
