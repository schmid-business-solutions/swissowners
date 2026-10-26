"use client";
import { useEffect, useState } from "react";
import { PALETTES } from "@/lib/palette";

/** Schwebender Umschalter für die Farbvorschau. Erscheint nur nach Aufruf mit ?farben=1 (danach bis zum Schliessen). */
export default function PaletteSwitcher() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState("aktuell");

  useEffect(() => {
    try {
      setShow(localStorage.getItem("swo_palette_ui") === "1");
      setCurrent(localStorage.getItem("swo_palette") ?? "aktuell");
    } catch {}
  }, []);

  const apply = (id: string) => {
    setCurrent(id);
    const d = document.documentElement;
    if (id === "aktuell") d.removeAttribute("data-palette"); else d.setAttribute("data-palette", id);
    const theme = PALETTES.find((p) => p.id === id)?.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme ?? "#AF001E");
    try { localStorage.setItem("swo_palette", id); } catch {}
  };

  const close = () => {
    setShow(false);
    try { localStorage.removeItem("swo_palette_ui"); } catch {}
  };

  if (!show) return null;
  if (!open) return <button className="pal-fab" onClick={() => setOpen(true)}><i />Farben</button>;
  return (
    <div className="pal" role="dialog" aria-label="Farbvorschau">
      <div className="pal-head">
        <b>Farbvorschau</b>
        <span>
          <button className="pal-x" onClick={() => setOpen(false)} aria-label="Minimieren" title="Minimieren">–</button>
          <button className="pal-x" onClick={close} aria-label="Umschalter ausblenden" title="Umschalter ausblenden">×</button>
        </span>
      </div>
      <div className="pal-list">
        {PALETTES.map((p) => (
          <button key={p.id} className="pal-opt" aria-pressed={current === p.id} onClick={() => apply(p.id)}>
            <i className="pal-sw" style={{ background: p.sw }} />
            <span><b>{p.name}</b><small>{p.desc}</small></span>
          </button>
        ))}
      </div>
      <p className="pal-note">Nur in diesem Browser sichtbar – Besucher sehen weiterhin «Aktuell». Die Wahl bleibt beim Seitenwechsel erhalten.</p>
    </div>
  );
}
