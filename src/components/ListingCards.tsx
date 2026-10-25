import Link from "next/link";
import type { Listing } from "@/lib/db/schema";
import { ago, chf, listingNo } from "@/lib/format";
import { Arrow, Check, Star } from "./Icons";

/* Branchenbilder: gezeichnete Illustrationen pro Hauptbranche (keine Fotos), mit schrägem Farbverlauf [dunkel, hell, Symbol] */
const ART: Record<string, [string, string, string]> = {
  "Software und IT": ["#163E78", "#3A7BD5", "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"],
  "Gesundheit und Life Sciences": ["#0B5F59", "#26B0A0", "M3 12h4l2-5 4 10 2-5h6M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20"],
  "Industrie und Produktion": ["#2E3B57", "#6B80AD", "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14M12 2v3M12 19v3M2 12h3M19 12h3"],
  "Bau und Immobilien": ["#8A3F14", "#E08A2E", "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"],
  "Handwerk und Gewerbe": ["#6A3A16", "#C27A3A", "M14 4l6 6-3 3-6-6zM11 7l-8 8 3 3 8-8"],
  "Gastronomie und Lebensmittel": ["#8E1F18", "#E5583A", "M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"],
  "Tourismus und Freizeit": ["#164F96", "#43A2E3", "M2 20l7-12 4 6 3-4 6 10zM18 3a2 2 0 1 0 0 4a2 2 0 1 0 0-4"],
  Handel: ["#4A2A80", "#9A68D6", "M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"],
  Unternehmensdienstleistungen: ["#164A37", "#3A9C70", "M3 8h18v11H3zM9 8V5h6v3M3 13h18"],
  "Energie und Umwelt": ["#22661F", "#7DC243", "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"],
  "Transport und Logistik": ["#2C3A4E", "#6A8BB0", "M2 7h11v9H2zM13 10h5l3 3v3h-8zM6 16a2 2 0 1 0 0 4a2 2 0 1 0 0-4M17 16a2 2 0 1 0 0 4a2 2 0 1 0 0-4"],
  "Bildung und Medien": ["#7A5608", "#DDAA36", "M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7M8 11h5"],
  "Landwirtschaft und Weinbau": ["#3F5E16", "#97BC44", "M12 21V9M12 9c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2-5-6-5 0 3 2 5 6 5z"],
  "Andere Branche": ["#3D4552", "#8A94A6", "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
};

const artId = (b: string) => "art-" + b.toLowerCase().replace(/[^a-z]+/g, "-");

export function Art({ branche }: { branche: string }) {
  const key = ART[branche] ? branche : "Andere Branche";
  const a = ART[key];
  const id = artId(key);
  return (
    <>
      <svg className="art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={a[0]} />
            <stop offset="1" stopColor={a[1]} />
          </linearGradient>
          <radialGradient id={id + "-glow"} cx="0.78" cy="0.2" r="0.6">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="200" fill={`url(#${id})`} />
        <rect width="320" height="200" fill={`url(#${id}-glow)`} />
        <circle cx="250" cy="40" r="120" fill="#FFFFFF" opacity="0.08" />
        <circle cx="250" cy="40" r="70" fill="#FFFFFF" opacity="0.08" />
        <path d="M0 170 L320 110 L320 200 L0 200 Z" fill="#000" opacity="0.14" />
      </svg>
      <svg className="art-ico" viewBox="-1 -1 26 26" aria-hidden="true">
        <g fill="none" stroke="#FFFFFF" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" opacity="0.95"><path d={a[2]} /></g>
      </svg>
    </>
  );
}

type CardData = Pick<Listing, "type" | "segment" | "title" | "branche" | "sub" | "kanton" | "legalForm" | "stake" | "amount" | "valuation" | "minTicket" | "revenueClass" | "phase" | "vinkuliert" | "vorkauf" | "companyInformed" | "shareClass" | "plan" | "description"> & { id?: number; publishedAt?: Date | null; isSample?: boolean };

export function facts(l: CardData): { f1: [string, string]; f2: [string, string] } {
  if (l.type === "sell") return { f1: ["Anteil", l.stake || "–"], f2: ["Preisvorstellung", chf(l.amount)] };
  const f2: [string, string] = l.valuation != null ? ["Bewertung", chf(l.valuation)] : l.minTicket != null ? ["Mindestbetrag", chf(l.minTicket)] : ["Bewertung", "auf Anfrage"];
  return { f1: ["Gesucht", chf(l.amount)], f2 };
}

export function TypePill({ type }: { type: "sell" | "cap" }) {
  return type === "sell" ? <span className="pill sell">Anteile verkaufen</span> : <span className="pill cap">Kapital gesucht</span>;
}
export function SegPill({ seg }: { seg: "kmu" | "startup" }) {
  return seg === "startup" ? <span className="pill seg-st">Startup</span> : <span className="pill seg-kmu">KMU</span>;
}

export function Badges({ l, noPrem, short }: { l: CardData; noPrem?: boolean; short?: boolean }) {
  return (
    <>
      {l.isSample && <span className="chip sample">Musterangebot</span>}
      {l.plan === "premium" && !noPrem && <span className="chip prem"><Star />Top-Angebot</span>}
      {!l.isSample && <span className="chip ok"><Check />Verifiziert</span>}
      {l.isSample ? null : l.type === "cap" ? <span className="chip ok">Firma inseriert selbst</span> : l.companyInformed ? <span className="chip ok">Firma informiert</span> : null}
      {!short && l.vinkuliert === "ja" && <span className="chip">Vinkuliert</span>}
      {!short && l.vorkauf === "ja" && <span className="chip">Vorkaufsrecht</span>}
      {!short && l.legalForm === "GmbH" && <span className="chip">Zustimmung GV nötig</span>}
      {!short && l.shareClass && <span className="chip">{l.shareClass === "vorzug" ? "Vorzugsaktien" : "Stammaktien"}</span>}
    </>
  );
}

/** Angebot in der Übersicht: Bild, Titel, kurze Beschreibung, eine Hauptzahl */
export function RowCard({ l, org }: { l: Listing; org?: { name: string; slug: string } }) {
  const { f1, f2 } = facts(l);
  const big = l.type === "sell" ? f2 : f1, small = l.type === "sell" ? f1 : f2;
  const cls = "lcard" + (l.plan === "premium" ? " is-prem" : l.plan === "plus" || l.plan === "start" ? " is-plus" : "") + (l.isSample ? " is-sample" : "");
  return (
    <Link className={cls} href={`/inserate/${listingNo(l.id)}`} aria-label={`Angebot ansehen: ${l.title}`}>
      <span className="lc-art">
        <Art branche={l.branche} />
        <span className="lc-br">{l.branche}</span>
        {l.plan === "premium" && <span className="lc-prem"><Star />Top-Angebot</span>}
        {l.isSample && <span className="lc-sample">Musterangebot</span>}
      </span>
      <span className="lc-main">
        <span className="lc-top">
          <span className="row" style={{ gap: 6 }}><TypePill type={l.type} /><SegPill seg={l.segment} /></span>
          <span className="small muted" style={{ whiteSpace: "nowrap" }}>{ago(l.publishedAt)}</span>
        </span>
        <span className="lc-title">{l.title}</span>
        <span className="small muted">{l.sub} · {l.kanton}</span>
        <span className="lc-desc">{l.description}</span>
        <span className="badges"><Badges l={l} noPrem short />{org && <span className="chip org">Vertreten durch {org.name}</span>}</span>
      </span>
      <span className="lc-side">
        <span className="fact-l">{big[0]}</span>
        <span className="lc-big">{big[1]}</span>
        <span className="small muted">{small[0]}: {small[1]}</span>
        <span className="link lc-cta">Details ansehen <Arrow /></span>
      </span>
    </Link>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return <span><span className="fact-l">{k}</span><span className="fact-v" style={{ display: "block" }}>{v}</span></span>;
}

export function PremCard({ l }: { l: Listing }) {
  const { f1, f2 } = facts(l);
  return (
    <Link className="pcard" href={`/inserate/${listingNo(l.id)}`} aria-label={`Top-Angebot ansehen: ${l.title}`}>
      <span className="pc-top">
        <span className="prem-tag"><Star />Top-Angebot</span>
        <span className="row" style={{ gap: 6 }}><TypePill type={l.type} /><SegPill seg={l.segment} /></span>
      </span>
      <span className="pc-title">{l.title}</span>
      <span className="small muted">{l.sub} · {l.kanton} · {l.legalForm}</span>
      <span className="pc-desc">{l.description}</span>
      <span className="facts">
        <Fact k={f1[0]} v={f1[1]} /><Fact k={f2[0]} v={f2[1]} />
        {l.segment === "startup" ? <Fact k="Phase" v={l.phase || "–"} /> : <Fact k="Umsatz" v={l.revenueClass} />}
      </span>
      <span className="badges"><Badges l={l} noPrem /></span>
      <span className="btn btn-red pc-cta">Details ansehen <Arrow /></span>
    </Link>
  );
}

/** Kompakte Karte (Merkliste, Vorschau im Formular) */
export function Card({ l, href }: { l: CardData; href?: string }) {
  const { f1, f2 } = facts(l);
  const inner = (
    <>
      <span className="card-top">
        <span className="row" style={{ gap: 6 }}><TypePill type={l.type} /><SegPill seg={l.segment} /></span>
        <span className="small muted">{l.publishedAt ? ago(l.publishedAt) : "neu"}</span>
      </span>
      <span className="h3" style={{ fontSize: 19, lineHeight: 1.3 }}>{l.title || "Ohne Titel"}</span>
      <span className="small muted">{l.sub} · {l.kanton} · {l.legalForm}</span>
      <span className="facts">
        <Fact k={f1[0]} v={f1[1]} /><Fact k={f2[0]} v={f2[1]} />
        {l.segment === "startup" ? <Fact k="Phase" v={l.phase || "–"} /> : <Fact k="Umsatz" v={l.revenueClass} />}
      </span>
      <span className="badges"><Badges l={l} /></span>
      {href && <span className="link" style={{ minHeight: 32 }}>Details ansehen <Arrow /></span>}
    </>
  );
  return href ? <Link className="card" href={href}>{inner}</Link> : <div className="card" style={{ cursor: "default" }}>{inner}</div>;
}
