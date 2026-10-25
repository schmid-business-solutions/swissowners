import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { OrgLogo, ProfileCard, Tags } from "@/components/BoardCards";
import InquiryBox from "@/components/InquiryBox";
import { Check, Info, Lock } from "@/components/Icons";
import { getUser } from "@/lib/auth";
import { getMandate, mandateIdFromNo, mandateNo, matchingProfiles } from "@/lib/board";
import { db, schema } from "@/lib/db";
import { ago, date } from "@/lib/format";
import { getOrg } from "@/lib/orgs";
import { BOARD_ROLE_LABEL, ORG_KIND_LABEL } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ nr: string }> }): Promise<Metadata> {
  const id = mandateIdFromNo((await params).nr);
  const m = id ? await getMandate(id) : undefined;
  if (!m || m.status !== "online") return { title: "VR-Mandat", robots: { index: false } };
  return { title: m.isSample ? `Mustermandat: ${m.title}` : `VR-Mandat: ${m.title}`, description: m.description.slice(0, 160), robots: m.isSample ? { index: false } : undefined };
}

export default async function MandatePage({ params }: { params: Promise<{ nr: string }> }) {
  const id = mandateIdFromNo((await params).nr);
  const m = id ? await getMandate(id) : undefined;
  if (!m) notFound();
  const user = await getUser();
  const isOwner = user?.id === m.ownerId;
  const isAdmin = user?.role === "admin";
  if (m.status !== "online" && !isOwner && !isAdmin) notFound();
  const [[sent], org, matches] = await Promise.all([
    user && !isOwner ? db.select().from(schema.inquiries).where(and(eq(schema.inquiries.kind, "mandate"), eq(schema.inquiries.targetId, m.id), eq(schema.inquiries.senderId, user.id))).limit(1) : Promise.resolve([]),
    m.orgId ? getOrg(m.orgId) : Promise.resolve(undefined),
    matchingProfiles(m, 3),
  ]);
  if (!isOwner && !isAdmin && m.status === "online") await db.update(schema.boardMandates).set({ views: sql`${schema.boardMandates.views} + 1` }).where(eq(schema.boardMandates.id, m.id));
  const no = mandateNo(m.id);
  const path = `/verwaltungsraete/mandate/${no}`;
  const revealed = isOwner || isAdmin || Boolean(sent);
  const mode = m.isSample ? "sample" : isOwner ? "own" : !user ? "anon" : !user.emailVerifiedAt ? "unverified" : sent ? "sent" : "ready";
  const kv: [string, string][] = [
    ["Funktion", BOARD_ROLE_LABEL[m.role]], ["Firma", m.segment === "startup" ? `Startup${m.phase ? `, ${m.phase}` : ""}` : "KMU"],
    ["Branche", m.branche], ["Kanton", m.kanton],
    ["Aufwand", m.effort], ["Entschädigung", m.fee], ["Sprachen", m.languages], ["Start", m.startAt],
    ...(m.revenueClass ? [["Umsatz", m.revenueClass] as [string, string]] : []),
    ...(m.employees != null ? [["Mitarbeitende", String(m.employees)] as [string, string]] : []),
  ];

  return (
    <section style={{ paddingBlock: 28 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <nav className="crumbs" aria-label="Pfad"><Link href="/">Start</Link><span>/</span><Link href="/verwaltungsraete">Verwaltungsräte</Link><span>/</span><span>{no}</span></nav>
        {m.status !== "online" && <div className="notice"><Info /><span><b>{m.status === "in_review" ? "In Prüfung – das Mandat ist noch nicht öffentlich." : m.status === "rejected" ? "Nicht freigeschaltet." : "Nicht öffentlich."}</b>{m.rejectionReason ? ` Grund: ${m.rejectionReason}` : ""}</span></div>}
        <div className="detail">
          <div className="detail-main">
            <div className="stack" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 10 }}>
                <span className="pill vr">{BOARD_ROLE_LABEL[m.role]}</span>
                <span className={"pill " + (m.segment === "startup" ? "seg-st" : "seg-kmu")}>{m.segment === "startup" ? "Startup" : "KMU"}</span>
                <span className="small muted">Mandat-Nr. {no} · {ago(m.publishedAt)} · {m.views} Aufrufe</span>
              </div>
              <h1 className="h2">{m.title}</h1>
              {m.isSample && <div className="sample-note"><Info /><span><b>Mustermandat.</b> Dieses Mandat ist ein fiktives Beispiel. Firma und Angaben sind erfunden; Anfragen sind nicht möglich.</span></div>}
              <div className="row" style={{ gap: 6 }}>
                {m.isSample ? <span className="chip sample">Mustermandat</span> : <span className="chip ok"><Check />Persönlich geprüft</span>}
                {m.investWelcome && <span className="chip ok">Beteiligung möglich</span>}
              </div>
            </div>
            <div className="kv">{kv.map(([k, v]) => <div key={k}><div className="fact-l">{k}</div><div className="fact-v">{v}</div></div>)}</div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Gesuchte Kompetenzen</h2><Tags list={m.skills} max={10} /></div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Ausgangslage und Aufgabe</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{m.description}</p></div>
            {m.requirements && <div className="stack" style={{ gap: 10 }}><h2 className="h3">Anforderungen</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{m.requirements}</p></div>}
            <div className="stack" style={{ gap: 10 }}>
              <h2 className="h3">Firma</h2>
              {revealed ? (
                <div className="notice" style={{ background: "var(--ok-soft)" }}><Check size={22} /><span><b>{m.companyName}</b><br /><span className="small">{m.companyUid} · <a href={`https://www.zefix.ch/de/search/entity/list?name=${encodeURIComponent(m.companyUid)}`} target="_blank" rel="noopener noreferrer">Handelsregister (Zefix)</a></span>{sent?.ndaAcceptedAt && <><br /><span className="small">Vertraulichkeit bestätigt am {date(sent.ndaAcceptedAt)}</span></>}</span></div>
              ) : (
                <div className="row" style={{ gap: 12 }}><span className="hidden-name"><Lock /><span className="blur" aria-hidden="true">Muster Beispiel AG</span><span className="small muted">verborgen</span></span><span className="small muted">Sichtbar, sobald Sie Interesse melden</span></div>
              )}
            </div>
            {matches.length > 0 && (isOwner || isAdmin || m.isSample) && (
              <div className="stack" style={{ gap: 12 }}>
                <h2 className="h3">Passende Verwaltungsräte</h2>
                <div className="grid g3">{matches.map((p) => <ProfileCard key={p.id} p={p} loggedIn={Boolean(user)} />)}</div>
              </div>
            )}
          </div>
          <aside className="detail-side" aria-label="Kontakt">
            <div className="stack" style={{ gap: 4 }}><span className="fact-l">Entschädigung</span><span style={{ fontSize: 22, fontWeight: 800 }}>{m.fee}</span><span className="small muted">Aufwand: {m.effort}</span></div>
            {org && org.status === "online" && (
              <Link href={`/partner/${org.slug}`} className="org-box"><OrgLogo name={org.name} size={44} /><span className="stack" style={{ gap: 2, minWidth: 0 }}><span className="fact-l">Vertreten durch</span><b>{org.name}</b><span className="small muted">{ORG_KIND_LABEL[org.kind]}</span></span></Link>
            )}
            <InquiryBox kind="mandate" targetId={m.id} path={path} mode={mode} label="Interesse melden" title="Interesse am Mandat melden"
              placeholder="Stellen Sie sich kurz vor: Erfahrung, heutige Mandate und warum Sie dieses Mandat interessiert."
              sampleText="Mustermandat – keine Anfrage möglich" ownHref="/konto?tab=vr" ownLabel="Ihr Mandat verwalten" />
            <p className="small muted">{user ? "Tipp: Mit einem VR-Profil senden wir Ihr Profil automatisch mit." : "Kostenlos registrieren und Interesse melden."} SwissOwners vermittelt nicht; Auswahl und Vertrag liegen bei der Firma.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
