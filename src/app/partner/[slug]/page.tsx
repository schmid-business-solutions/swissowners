import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { MandateCard, OrgLogo, Tags } from "@/components/BoardCards";
import InquiryBox from "@/components/InquiryBox";
import { RowCard } from "@/components/ListingCards";
import { Check, Info } from "@/components/Icons";
import { getUser } from "@/lib/auth";
import { mandateNo } from "@/lib/board";
import { db, schema } from "@/lib/db";
import { date } from "@/lib/format";
import { getOrgBySlug, membership } from "@/lib/orgs";
import { ORG_KIND_LABEL, orgGroupOf, splitList } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = await getOrgBySlug((await params).slug);
  if (!o || o.status !== "online") return { title: "Partner", robots: { index: false } };
  return { title: o.isSample ? `Musterpartner: ${o.name}` : o.name, description: o.tagline, robots: o.isSample ? { index: false } : undefined };
}

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const o = await getOrgBySlug((await params).slug);
  if (!o) notFound();
  const user = await getUser();
  const mem = user ? await membership(o.id, user.id) : undefined;
  const isAdmin = user?.role === "admin";
  if (o.status !== "online" && !mem && !isAdmin) notFound();

  const [listings, mandates, [sent]] = await Promise.all([
    db.select().from(schema.listings).where(and(eq(schema.listings.orgId, o.id), eq(schema.listings.status, "online"))).orderBy(desc(schema.listings.publishedAt)),
    db.select().from(schema.boardMandates).where(and(eq(schema.boardMandates.orgId, o.id), eq(schema.boardMandates.status, "online"))).orderBy(desc(schema.boardMandates.publishedAt)),
    user ? db.select().from(schema.inquiries).where(and(eq(schema.inquiries.kind, "org"), eq(schema.inquiries.targetId, o.id), eq(schema.inquiries.senderId, user.id))).limit(1) : Promise.resolve([]),
  ]);
  const path = `/partner/${o.slug}`;
  const mode = o.isSample ? "sample" : mem ? "own" : !user ? "anon" : !user.emailVerifiedAt ? "unverified" : sent ? "sent" : "ready";
  const startup = orgGroupOf(o.kind) === "startup";
  const kv: [string, string][] = [
    ["Art", ORG_KIND_LABEL[o.kind]], ["Standort", `${o.city} (${o.kanton})`], ["Sprachen", o.languages],
    ...(o.focus ? [[startup ? "Fokus" : "Schwerpunkt", o.focus] as [string, string]] : []),
    ["Branchen", o.branchen ? splitList(o.branchen).join(", ") : "Alle Branchen"],
  ];

  return (
    <section style={{ paddingBlock: 28 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <nav className="crumbs" aria-label="Pfad"><Link href="/">Start</Link><span>/</span><Link href="/partner">Partner</Link><span>/</span><span>{o.name}</span></nav>
        {o.status !== "online" && <div className="notice"><Info /><span><b>{o.status === "rejected" ? "Nicht freigeschaltet." : o.status === "in_review" ? "In Prüfung – das Profil ist noch nicht öffentlich." : "Nicht öffentlich."}</b>{o.status === "rejected" && o.rejectionReason ? ` Grund: ${o.rejectionReason}` : ""}</span></div>}
        <div className="detail">
          <div className="detail-main">
            <div className="row" style={{ gap: 16, alignItems: "center", flexWrap: "nowrap" }}>
              <OrgLogo name={o.name} size={72} />
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                <h1 className="h2">{o.name}</h1>
                <span className="muted">{o.tagline}</span>
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {o.isSample ? <span className="chip sample">Musterpartner</span> : o.verified ? <span className="chip ok"><Check />Verifizierter Partner</span> : null}
              <span className={"pill " + (startup ? "seg-st" : "seg-kmu")}>{startup ? "Startup-Förderung und Investoren" : "Beratung und M&A"}</span>
            </div>
            {o.isSample && <div className="sample-note"><Info /><span><b>Musterpartner.</b> Dieses Profil ist ein fiktives Beispiel und zeigt, wie Partner auf SwissOwners auftreten. Name und Angaben sind erfunden; Anfragen sind nicht möglich.</span></div>}
            <div className="kv">{kv.map(([k, v]) => <div key={k}><div className="fact-l">{k}</div><div className="fact-v">{v}</div></div>)}</div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Über uns</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{o.description}</p></div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Leistungen</h2><Tags list={o.services} max={20} /></div>
            {listings.length > 0 && (
              <div className="stack" style={{ gap: 12 }}>
                <h2 className="h3">Aktuelle Angebote ({listings.length})</h2>
                <div className="list-rows">{listings.map((l) => <RowCard key={l.id} l={l} org={{ name: o.name, slug: o.slug }} />)}</div>
              </div>
            )}
            {mandates.length > 0 && (
              <div className="stack" style={{ gap: 12 }}>
                <h2 className="h3">Gesuchte Verwaltungsräte ({mandates.length})</h2>
                <div className="grid g3">{mandates.map((m) => <MandateCard key={m.id} m={m} href={`/verwaltungsraete/mandate/${mandateNo(m.id)}`} />)}</div>
              </div>
            )}
          </div>
          <aside className="detail-side" aria-label="Kontakt">
            <span className="fact-l">Kontakt</span>
            {!o.isSample && (
              <div className="stack small" style={{ gap: 4 }}>
                {o.website && <a href={o.website} target="_blank" rel="noopener noreferrer">{o.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>}
                {o.phone && <span>{o.phone}</span>}
              </div>
            )}
            <InquiryBox kind="org" targetId={o.id} path={path} mode={mode} label="Anfrage senden" title={`Anfrage an ${o.name}`}
              placeholder="Worum geht es? Zum Beispiel: Ich möchte meine Firma in den nächsten zwei Jahren übergeben."
              sampleText="Musterpartner – keine Anfrage möglich" ownHref="/konto?tab=partner" ownLabel="Profil verwalten" />
            <p className="small muted">{o.isSample ? "Fiktives Beispiel zur Veranschaulichung." : o.publishedAt ? `Auf SwissOwners seit ${date(o.publishedAt)}.` : ""} Honorare und Verträge vereinbaren Sie direkt mit dem Partner.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
