"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Cross, Lock } from "@/components/Icons";

const Handshake = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11l4-4 4 2 3-2 3 1 4 4" /><path d="M7 13l3 3a1.5 1.5 0 0 0 2 0l4-4" /><path d="M10 16l1.5 1.5a1.5 1.5 0 0 0 2 0L17 14" /><path d="M3 11v3l3 3" /><path d="M21 12v2l-4 4" />
  </svg>
);

const Person = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);

const SLIDES = [
  { icon: <Cross size={54} />, title: "Schweizer Firmenanteile. Direkt gehandelt.", text: "Kaufen, verkaufen oder Kapital suchen: SwissOwners ist der Marktplatz für Anteile an nicht kotierten KMU und Startups." },
  { icon: <Lock size={40} color="#FFFFFF" />, title: "Diskret von Anfang an.", text: "Firmenname und UID bleiben verborgen. Erst nach einer digitalen Vertraulichkeitserklärung erfahren Interessenten, um welche Firma es geht." },
  { icon: <Handshake />, title: "Direkt verhandeln, ohne Provision.", text: "Käufer und Verkäufer einigen sich selbst. Jedes Angebot prüfen wir vor der Freischaltung." },
];

function markSeen() {
  try { document.cookie = "swo_intro=1; path=/; max-age=31536000; samesite=lax"; } catch {}
}

export default function AppIntro({ loginHref, registerHref }: { loginHref: string; registerHref: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const last = SLIDES.length; // Index der Schlussfolie
  const go = (n: number) => track.current?.scrollTo({ left: n * track.current.clientWidth, behavior: "smooth" });
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const n = Math.round(el.scrollLeft / el.clientWidth);
    if (n !== i) { setI(n); if (n === last) markSeen(); }
  };

  return (
    <div className="app-intro">
      <div className="app-intro-top">
        {i < last && <button className="btn btn-ghost" onClick={() => { markSeen(); go(last); }}>Überspringen</button>}
      </div>
      <div className="app-track" ref={track} onScroll={onScroll}>
        {SLIDES.map((s, n) => (
          <section className="app-slide" key={n} aria-roledescription="Folie" aria-label={`${n + 1} von ${last + 1}`}>
            <span className="app-mark app-mark-lg">{s.icon}</span>
            <h1 className="app-title">{s.title}</h1>
            <p className="app-lead">{s.text}</p>
          </section>
        ))}
        <section className="app-slide" aria-roledescription="Folie" aria-label={`${last + 1} von ${last + 1}`}>
          <span className="app-mark app-mark-lg"><Person /></span>
          <h1 className="app-title">Willkommen bei SwissOwners</h1>
          <p className="app-lead">Melden Sie sich an oder erstellen Sie kostenlos ein Konto, um loszulegen.</p>
        </section>
      </div>
      <div className="app-intro-bottom">
        <div className="app-dots" role="tablist" aria-label="Intro-Folien">
          {[...SLIDES, null].map((_, n) => (
            <button key={n} role="tab" aria-selected={n === i} aria-label={`Folie ${n + 1}`} className={n === i ? "on" : ""} onClick={() => go(n)} />
          ))}
        </div>
        {i < last ? (
          <button className="btn btn-red btn-block" onClick={() => go(i + 1)}>Weiter</button>
        ) : (
          <div className="app-cta">
            <Link className="btn btn-red btn-block" href={loginHref} onClick={markSeen}>Anmelden</Link>
            <Link className="btn btn-line btn-block" href={registerHref} onClick={markSeen}>Kostenlos registrieren</Link>
          </div>
        )}
      </div>
    </div>
  );
}
