import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { MandateCard, PersonAvatar, Tags, profileName } from "@/components/BoardCards";
import InquiryBox from "@/components/InquiryBox";
import { Info } from "@/components/Icons";
import { getUser } from "@/lib/auth";
import { getProfile, mandateNo, matchingMandates } from "@/lib/board";
import { db, schema } from "@/lib/db";
import { splitList } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await getProfile(Number((await params).id));
  if (!p || p.status !== "online") return { title: "VR-Profil", robots: { index: false } };
  const title = p.visibility === "public" && !p.isSample ? `${p.displayName}, Verwaltungsrat` : p.isSample ? `Musterprofil: ${p.headline}` : `VR-Profil: ${p.headline}`;
  return { title, description: p.bio.slice(0, 160), robots: p.visibility === "public" && !p.isSample ? undefined : { index: false } };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const p = await getProfile(Number((await params).id));
  if (!p) notFound();
  const user = await getUser();
  const isOwner = user?.id === p.userId && !p.isSample;
  const isAdmin = user?.role === "admin";
  if (p.status !== "online" && !isOwner && !isAdmin) notFound();
  const [[sent], matches] = await Promise.all([
    user && !isOwner ? db.select().from(schema.inquiries).where(and(eq(schema.inquiries.kind, "profile"), eq(schema.inquiries.targetId, p.id), eq(schema.inquiries.senderId, user.id))).limit(1) : Promise.resolve([]),
    isOwner || p.isSample ? matchingMandates(p, 3) : Promise.resolve([]),
  ]);
  if (!isOwner && !isAdmin && p.status === "online") await db.update(schema.boardProfiles).set({ views: sql`${schema.boardProfiles.views} + 1` }).where(eq(schema.boardProfiles.id, p.id));
  const { name, hidden } = isOwner || isAdmin ? { name: p.displayName, hidden: false } : profileName(p, Boolean(user));
  const path = `/verwaltungsraete/profile/${p.id}`;
  const mode = p.isSample ? "sample" : isOwner ? "own" : !user ? "anon" : !user.emailVerifiedAt ? "unverified" : sent ? "sent" : "ready";
  const kv: [string, string][] = [
    ["Region", `${p.kanton}`], ["Verfügbarkeit", p.capacity], ["Sprachen", p.languages],
    ...(p.fee ? [["Entschädigung", p.fee] as [string, string]] : []),
    ...(p.investor ? [["Investiert auch", p.ticket || "ja"] as [string, string]] : []),
    ["Branchen", p.branchen ? splitList(p.branchen).join(", ") : "offen"],
  ];
  const mandates = splitList(p.mandates?.replace(/\n/g, ",") ?? "");

  return (
    <section style={{ paddingBlock: 28 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <nav className="crumbs" aria-label="Pfad"><Link href="/">Start</Link><span>/</span><Link href="/verwaltungsraete?ansicht=profile">Verwaltungsräte</Link><span>/</span><span>Profil</span></nav>
        {p.status !== "online" && <div className="notice"><Info /><span><b>{p.status === "in_review" ? "In Prüfung – Ihr Profil ist noch nicht öffentlich." : p.status === "paused" ? "Pausiert – Ihr Profil ist nicht sichtbar." : "Nicht freigeschaltet."}</b>{p.rejectionReason ? ` Grund: ${p.rejectionReason}` : ""}</span></div>}
        <div className="detail">
          <div className="detail-main">
            <div className="row" style={{ gap: 16, alignItems: "center", flexWrap: "nowrap" }}>
              <PersonAvatar name={p.displayName} hidden={hidden} size={76} />
              <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                <h1 className="h2">{name}</h1>
                <span className="muted">{p.headline}</span>
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {p.isSample && <span className="chip sample">Musterprofil</span>}
              {p.investor && <span className="chip ok">Investiert auch</span>}
              {p.visibility === "anonymous" && <span className="chip">Anonym</span>}
            </div>
            {p.isSample && <div className="sample-note"><Info /><span><b>Musterprofil.</b> Diese Person ist erfunden und zeigt, wie VR-Profile auf SwissOwners aussehen. Anfragen sind nicht möglich.</span></div>}
            {hidden && !p.isSample && <div className="notice neutral small"><Info /><span>{p.visibility === "anonymous" ? "Diese Person möchte anonym bleiben. Über «Kontakt aufnehmen» erreicht Ihre Nachricht sie direkt; sie entscheidet, ob sie antwortet." : "Der Name ist nur für angemeldete Personen sichtbar."}</span></div>}
            <div className="kv">{kv.map(([k, v]) => <div key={k}><div className="fact-l">{k}</div><div className="fact-v">{v}</div></div>)}</div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Kompetenzen</h2><Tags list={p.skills} max={10} /></div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Porträt</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{p.bio}</p></div>
            <div className="stack" style={{ gap: 10 }}><h2 className="h3">Werdegang</h2><p style={{ maxWidth: "65ch", whiteSpace: "pre-line" }}>{p.experience}</p></div>
            {mandates.length > 0 && <div className="stack" style={{ gap: 10 }}><h2 className="h3">Heutige Mandate</h2><ul className="plain-list">{mandates.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {matches.length > 0 && (
              <div className="stack" style={{ gap: 12 }}>
                <h2 className="h3">Passende Mandate</h2>
                <div className="grid g3">{matches.map((m) => <MandateCard key={m.id} m={m} href={`/verwaltungsraete/mandate/${mandateNo(m.id)}`} />)}</div>
              </div>
            )}
          </div>
          <aside className="detail-side" aria-label="Kontakt">
            <span className="fact-l">Kontakt</span>
            {!hidden && p.linkedin && !p.isSample && <a className="small" href={p.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn-Profil</a>}
            <InquiryBox kind="profile" targetId={p.id} path={path} mode={mode} label="Kontakt aufnehmen" title="Kontakt aufnehmen"
              placeholder="Stellen Sie Ihre Firma kurz vor und beschreiben Sie das Mandat."
              sampleText="Musterprofil – keine Anfrage möglich" ownHref="/verwaltungsraete/mein-profil" ownLabel="Profil bearbeiten" />
            <p className="small muted">Die Nachricht geht direkt an die Person. SwissOwners vermittelt nicht.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
