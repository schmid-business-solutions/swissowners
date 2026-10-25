import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { Badges, SegPill, TypePill, facts } from "@/components/ListingCards";
import { Check, Info, Lock } from "@/components/Icons";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getListing } from "@/lib/listings";
import { ago, date, idFromNo, listingNo } from "@/lib/format";
import Contact from "./Contact";
import { getOrg } from "@/lib/orgs";
import { OrgLogo } from "@/components/BoardCards";
import { ORG_KIND_LABEL } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

const STATUS_NOTE: Record<string, string> = {
  draft: "Entwurf – noch nicht eingereicht.",
  pending_payment: "Zahlung ausstehend – das Angebot ist noch nicht eingereicht.",
  in_review: "In Prüfung – das Angebot ist noch nicht öffentlich.",
  paused: "Pausiert – das Angebot ist nicht öffentlich sichtbar.",
  expired: "Beendet – das Angebot ist nicht mehr öffentlich.",
  sold: "Als verkauft markiert – das Angebot ist nicht mehr öffentlich.",
  rejected: "Nicht freigeschaltet – bitte anpassen und erneut einreichen.",
};

export async function generateMetadata({ params }: { params: Promise<{ nr: string }> }): Promise<Metadata> {
  const id = idFromNo((await params).nr);
  const l = id ? await getListing(id) : undefined;
  if (!l || l.status !== "online") return { title: "Angebot", robots: { index: false } };
  if (l.isSample) return { title: `Musterangebot: ${l.title}`, robots: { index: false } };
  return { title: l.title, description: l.description.slice(0, 160) };
}

export default async function DetailPage({ params }: { params: Promise<{ nr: string }> }) {
  const id = idFromNo((await params).nr);
  const l = id ? await getListing(id) : undefined;
  if (!l) notFound();
  const user = await getUser();
  const isOwner = user?.id === l.ownerId;
  const isAdmin = user?.role === "admin";
  if (l.status !== "online" && !isOwner && !isAdmin) notFound();

  const [req] = user && !isOwner
    ? await db.select().from(schema.contactRequests).where(and(eq(schema.contactRequests.listingId, l.id), eq(schema.contactRequests.senderId, user.id))).limit(1)
    : [];
  const [saved] = user
    ? await db.select().from(schema.savedListings).where(and(eq(schema.savedListings.listingId, l.id), eq(schema.savedListings.userId, user.id))).limit(1)
    : [];
  if (!isOwner && !isAdmin && l.status === "online") {
    await db.update(schema.listings).set({ views: sql`${schema.listings.views} + 1` }).where(eq(schema.listings.id, l.id));
  }

  const org = l.orgId ? await getOrg(l.orgId) : undefined;
  const showOrg = org && org.status === "online";
  const revealed = isOwner || isAdmin || Boolean(req);
  const no = listingNo(l.id);
  const { f1, f2 } = facts(l);
  const big = l.type === "sell" ? f2 : f1, small = l.type === "sell" ? f1 : f2;
  const kv: [string, string][] = [
    ["Branche", l.sub], ["Kanton", l.kanton],
    l.segment === "startup" ? ["Phase", l.phase || "–"] : ["Rechtsform", l.legalForm],
    ["Gegründet", l.foundedYear ? String(l.foundedYear) : "–"],
    ["Mitarbeitende", l.employees != null ? String(l.employees) : "–"],
    ["Umsatzklasse", l.revenueClass], f1, f2,
  ];
  const mode = l.isSample ? "sample" : isOwner ? "owner" : !user ? "anon" : !user.emailVerifiedAt ? "unverified" : req ? "sent" : "ready";

  return (
    <section style={{ paddingBlock: 28 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <nav className="crumbs" aria-label="Pfad">
          <Link href="/">Start</Link><span>/</span><Link href="/inserate">Angebote</Link><span>/</span>
          <Link href={`/inserate?branche=${encodeURIComponent(l.branche)}`}>{l.branche}</Link><span>/</span>
          <Link href={`/inserate?branche=${encodeURIComponent(l.branche)}&sub=${encodeURIComponent(l.sub)}`}>{l.sub}</Link>
        </nav>
        {l.status !== "online" && (
          <div className="notice"><Info /><span><b>{STATUS_NOTE[l.status]}</b>{l.status === "rejected" && l.rejectionReason ? ` Grund: ${l.rejectionReason}` : ""}</span></div>
        )}
        <div className="detail">
          <div className="detail-main">
            <div className="stack" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 10 }}>
                <TypePill type={l.type} /><SegPill seg={l.segment} />
                <span className="small muted">Angebots-Nr. {no} · {ago(l.publishedAt)} · {l.views} Aufrufe</span>
              </div>
              <h1 className="h2">{l.title}</h1>
              {l.isSample && (
                <div className="sample-note"><Info /><span><b>Musterangebot.</b> Dieses Angebot ist ein fiktives Beispiel und zeigt, wie Angebote auf SwissOwners aussehen. Firma und Angaben sind erfunden; Anfragen sind nicht möglich.</span></div>
              )}
              <div className="badges row" style={{ gap: 6 }}><Badges l={l} /></div>
            </div>
            <div className="kv">{kv.map(([k, v]) => <div key={k}><div className="fact-l">{k}</div><div className="fact-v">{v}</div></div>)}</div>
            {l.segment === "startup" && (
              <div className="notice neutral small"><Info /><span><b>Startup-Bewertung:</b> Der Preis der letzten Finanzierungsrunde ist kein Marktpreis. Bei Weiterverkäufen werden oft Abschläge bezahlt. Prüfen Sie Aktienkategorie, Vorzugsrechte und den Aktionärbindungsvertrag.</span></div>
            )}
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Beschreibung</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{l.description}</p></div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Grund für das Angebot</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{l.reason}</p></div>
            <div className="stack" style={{ gap: 10 }}>
              <h2 className="h3">Firma</h2>
              {revealed ? (
                <div className="notice" style={{ background: "var(--ok-soft)" }}><Check size={22} /><span><b>{l.companyName}</b><br /><span className="small">{l.companyUid} · <a href={`https://www.zefix.ch/de/search/entity/list?name=${encodeURIComponent(l.companyUid)}`} target="_blank" rel="noopener noreferrer">Handelsregister (Zefix)</a></span>{req && <><br /><span className="small">Vertraulichkeitserklärung unterzeichnet am {date(req.ndaAcceptedAt)}</span></>}</span></div>
              ) : (
                <div className="row" style={{ gap: 12 }}>
                  <span className="hidden-name"><Lock /><span className="blur" aria-hidden="true">Muster Beispiel AG</span><span className="small muted">verborgen</span></span>
                  <span className="small muted">Sichtbar nach digitaler Vertraulichkeitserklärung</span>
                </div>
              )}
            </div>
            <div className="notice neutral"><Info /><span className="small"><b>Vor einem Kauf prüfen:</b> {l.vinkuliert === "ja" ? "Die Anteile sind vinkuliert – die Gesellschaft muss der Übertragung zustimmen. " : ""}{l.vorkauf === "ja" ? "Bestehende Gesellschafter haben ein Vorkaufsrecht. " : ""}{l.legalForm === "GmbH" ? "Die Abtretung braucht die Zustimmung der Gesellschafterversammlung. " : ""}Die Angaben stammen vom Inserenten. SwissOwners ist nicht am Abschluss beteiligt.</span></div>
          </div>
          <aside className="detail-side" aria-label="Kontakt">
            <div className="stack" style={{ gap: 4 }}>
              <span className="fact-l">{big[0]}</span>
              <span style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{big[1]}</span>
              <span className="small muted">{small[0]}: {small[1]}</span>
            </div>
            {showOrg && (
              <Link href={`/partner/${org.slug}`} className="org-box">
                <OrgLogo name={org.name} size={44} />
                <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <span className="fact-l">Vertreten durch</span>
                  <b>{org.name}</b>
                  <span className="small muted">{ORG_KIND_LABEL[org.kind]} · {org.city}</span>
                </span>
              </Link>
            )}
            <Contact listingId={l.id} no={no} mode={mode} userName={user ? `${user.firstName} ${user.lastName}` : ""} userPhone={user?.phone ?? ""} saved={Boolean(saved)} />
            <p className="small muted">{l.isSample ? "Fiktives Beispiel zur Veranschaulichung." : `Persönlich geprüft am ${date(l.publishedAt)}.`} Keine Provision – Preis und Vertrag regeln Sie direkt mit dem Inserenten.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
