import Link from "next/link";
import type { BoardMandate, BoardProfile, Org } from "@/lib/db/schema";
import { ago } from "@/lib/format";
import { BOARD_ROLE_LABEL, ORG_KIND_LABEL, orgGroupOf, splitList } from "@/lib/taxonomy";
import { Arrow, Check, Lock } from "./Icons";

const initials = (name: string) =>
  name.replace(/\b(Dr\.|Prof\.|lic\.|AG|GmbH|SA|und|&)\s*/gi, "").split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export function OrgLogo({ name, size = 56 }: { name: string; size?: number }) {
  return <span className="mono mono-org" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">{initials(name)}</span>;
}

export function PersonAvatar({ name, hidden, size = 56 }: { name: string; hidden?: boolean; size?: number }) {
  return (
    <span className={"mono mono-person" + (hidden ? " is-hidden" : "")} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {hidden ? <Lock size={size * 0.4} /> : initials(name)}
    </span>
  );
}

export function Tags({ list, max = 4 }: { list: string; max?: number }) {
  const a = splitList(list);
  return (
    <span className="tags">
      {a.slice(0, max).map((t) => <span key={t} className="chip">{t}</span>)}
      {a.length > max && <span className="chip">+{a.length - max}</span>}
    </span>
  );
}

/** Profilname je nach Sichtbarkeit */
export function profileName(p: BoardProfile, loggedIn: boolean): { name: string; hidden: boolean } {
  if (p.visibility === "public" || (p.visibility === "members" && loggedIn)) return { name: p.displayName, hidden: false };
  return { name: p.visibility === "anonymous" ? "Anonymes Profil" : "Name nach Anmeldung sichtbar", hidden: true };
}

export function OrgCard({ o, active }: { o: Org; active: number }) {
  return (
    <Link className={"xcard" + (o.isSample ? " is-sample" : "")} href={`/partner/${o.slug}`} aria-label={`Partner ansehen: ${o.name}`}>
      <span className="xcard-head">
        <OrgLogo name={o.name} />
        <span className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="xcard-title">{o.name}</span>
          <span className="small muted">{ORG_KIND_LABEL[o.kind]} · {o.city}</span>
        </span>
      </span>
      <span className="xcard-text">{o.tagline}</span>
      <Tags list={o.services} max={3} />
      <span className="xcard-foot">
        <span className="row" style={{ gap: 6 }}>
          {o.isSample ? <span className="chip sample">Musterpartner</span> : o.verified ? <span className="chip ok"><Check />Verifiziert</span> : null}
          <span className={"pill " + (orgGroupOf(o.kind) === "startup" ? "seg-st" : "seg-kmu")}>{orgGroupOf(o.kind) === "startup" ? "Startup-Förderung" : "Beratung"}</span>
        </span>
        <span className="small muted">{active > 0 ? `${active} aktive ${active === 1 ? "Inserat" : "Inserate"}` : ""}</span>
      </span>
    </Link>
  );
}

export function MandateCard({ m, href }: { m: BoardMandate; href: string }) {
  return (
    <Link className={"xcard" + (m.isSample ? " is-sample" : "")} href={href} aria-label={`VR-Mandat ansehen: ${m.title}`}>
      <span className="xcard-top">
        <span className="row" style={{ gap: 6 }}>
          <span className="pill vr">{BOARD_ROLE_LABEL[m.role]}</span>
          <span className={"pill " + (m.segment === "startup" ? "seg-st" : "seg-kmu")}>{m.segment === "startup" ? "Startup" : "KMU"}</span>
        </span>
        <span className="small muted" style={{ whiteSpace: "nowrap" }}>{ago(m.publishedAt)}</span>
      </span>
      <span className="xcard-title">{m.title}</span>
      <span className="small muted">{m.branche} · {m.kanton}</span>
      <Tags list={m.skills} max={3} />
      <span className="xcard-foot">
        <span className="small"><b>Aufwand:</b> {m.effort}</span>
        <span className="row" style={{ gap: 6 }}>
          {m.isSample && <span className="chip sample">Mustermandat</span>}
          {m.investWelcome && <span className="chip ok">Beteiligung möglich</span>}
        </span>
      </span>
    </Link>
  );
}

export function ProfileCard({ p, loggedIn }: { p: BoardProfile; loggedIn: boolean }) {
  const { name, hidden } = profileName(p, loggedIn);
  return (
    <Link className={"xcard" + (p.isSample ? " is-sample" : "")} href={`/verwaltungsraete/profile/${p.id}`} aria-label={`VR-Profil ansehen: ${p.headline}`}>
      <span className="xcard-head">
        <PersonAvatar name={p.displayName} hidden={hidden} />
        <span className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="xcard-title">{name}</span>
          <span className="small muted">{p.headline}</span>
        </span>
      </span>
      <Tags list={p.skills} max={3} />
      <span className="xcard-foot">
        <span className="small muted">{p.kanton} · {p.capacity}</span>
        <span className="row" style={{ gap: 6 }}>
          {p.isSample && <span className="chip sample">Musterprofil</span>}
          {p.investor && <span className="chip ok">Investiert auch</span>}
        </span>
      </span>
      <span className="link" style={{ minHeight: 28 }}>Profil ansehen <Arrow /></span>
    </Link>
  );
}
