import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import ConfirmButton from "@/components/ConfirmButton";
import { requireAdmin } from "@/lib/auth";
import { mandateNo } from "@/lib/board";
import { db, schema } from "@/lib/db";
import { date } from "@/lib/format";
import { BOARD_ROLE_LABEL, ORG_KIND_LABEL } from "@/lib/taxonomy";
import { approveExtAction, createExtSamplesAction, deleteExtSampleAction, deleteExtSamplesAction, rejectExtAction } from "./actions";

export const metadata = { title: "Prüfung Partner und Verwaltungsräte", robots: { index: false } };
export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  freigeschaltet: "Freigeschaltet und per E-Mail informiert.", abgelehnt: "Abgelehnt und per E-Mail informiert.",
  "muster-angelegt": "Mustereinträge angelegt.", "muster-vorhanden": "Mustereinträge sind bereits vorhanden.", "muster-geloescht": "Muster gelöscht.",
};

function Decide({ kind, id, verify }: { kind: string; id: number; verify?: boolean }) {
  return (
    <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
      <form action={approveExtAction} className="row" style={{ gap: 8 }}>
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
        {verify && <label className="check small"><input type="checkbox" name="verified" defaultChecked /><span>UID geprüft (Badge)</span></label>}
        <button className="btn btn-red" style={{ minHeight: 40 }}>Freischalten</button>
      </form>
      <form action={rejectExtAction} className="row" style={{ gap: 8, flex: "1 1 280px" }}>
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
        <input name="reason" placeholder="Grund für die Ablehnung" aria-label="Grund" style={{ height: 40, border: "1px solid #B9B9B4", borderRadius: 8, padding: "0 10px", flex: 1, minWidth: 180 }} />
        <button className="btn btn-line" style={{ minHeight: 40 }}>Ablehnen</button>
      </form>
    </div>
  );
}

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireAdmin();
  const { ok, err } = await searchParams;
  const [orgs, profiles, mandates, samples] = await Promise.all([
    db.select().from(schema.orgs).where(eq(schema.orgs.status, "in_review")).orderBy(desc(schema.orgs.updatedAt)),
    db.select({ p: schema.boardProfiles, u: schema.users }).from(schema.boardProfiles).innerJoin(schema.users, eq(schema.users.id, schema.boardProfiles.userId)).where(eq(schema.boardProfiles.status, "in_review")).orderBy(desc(schema.boardProfiles.updatedAt)),
    db.select({ m: schema.boardMandates, u: schema.users }).from(schema.boardMandates).innerJoin(schema.users, eq(schema.users.id, schema.boardMandates.ownerId)).where(eq(schema.boardMandates.status, "in_review")).orderBy(desc(schema.boardMandates.updatedAt)),
    Promise.all([
      db.select({ id: schema.orgs.id, label: schema.orgs.name }).from(schema.orgs).where(eq(schema.orgs.isSample, true)),
      db.select({ id: schema.boardProfiles.id, label: schema.boardProfiles.displayName }).from(schema.boardProfiles).where(eq(schema.boardProfiles.isSample, true)),
      db.select({ id: schema.boardMandates.id, label: schema.boardMandates.title }).from(schema.boardMandates).where(eq(schema.boardMandates.isSample, true)),
    ]),
  ]);
  const [so, sp, sm] = samples;
  const online = await db.select({
    o: sql<number>`(select count(*) from orgs where status='online' and is_sample=0)`,
    p: sql<number>`(select count(*) from board_profiles where status='online' and is_sample=0)`,
    m: sql<number>`(select count(*) from board_mandates where status='online' and is_sample=0)`,
  }).from(sql`(select 1) x`);

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <h1 className="h2">Prüfung: Partner und Verwaltungsräte</h1>
          <Link className="btn btn-line" href="/admin">Zu den Angeboten</Link>
        </div>
        {ok && <p className="flash ok">{OK[ok] ?? "Erledigt."}</p>}
        {err === "grund" && <p className="flash err">Bitte einen Grund angeben (mindestens 5 Zeichen).</p>}
        <div className="admin-grid">
          <div className="statbox"><span className="small muted">Partner online (echt)</span><b>{Number(online[0].o)}</b></div>
          <div className="statbox"><span className="small muted">VR-Profile online (echt)</span><b>{Number(online[0].p)}</b></div>
          <div className="statbox"><span className="small muted">VR-Mandate online (echt)</span><b>{Number(online[0].m)}</b></div>
          <div className="statbox"><span className="small muted">Zur Prüfung</span><b>{orgs.length + profiles.length + mandates.length}</b></div>
        </div>

        <h2 className="h3">Partnerprofile ({orgs.length})</h2>
        {orgs.length === 0 && <p className="muted">Keine Partnerprofile in Prüfung.</p>}
        {orgs.map((o) => (
          <div className="adrow" key={o.id}>
            <div className="adrow-head"><div className="stack" style={{ gap: 4 }}><Link href={`/partner/${o.slug}`} style={{ fontWeight: 700 }}>{o.name}</Link><span className="small muted">{ORG_KIND_LABEL[o.kind]} · {o.city} ({o.kanton}) · UID {o.uid ?? "–"} · {o.email}{o.website ? ` · ${o.website}` : ""}</span></div><span className="small muted">{date(o.updatedAt)}</span></div>
            <p className="small">{o.tagline}</p>
            {o.uid && <a className="small" href={`https://www.zefix.ch/de/search/entity/list?name=${encodeURIComponent(o.uid)}`} target="_blank" rel="noopener noreferrer">Im Handelsregister prüfen (Zefix)</a>}
            <Decide kind="org" id={o.id} verify={Boolean(o.uid)} />
          </div>
        ))}

        <h2 className="h3">VR-Profile ({profiles.length})</h2>
        {profiles.length === 0 && <p className="muted">Keine VR-Profile in Prüfung.</p>}
        {profiles.map(({ p, u }) => (
          <div className="adrow" key={p.id}>
            <div className="adrow-head"><div className="stack" style={{ gap: 4 }}><Link href={`/verwaltungsraete/profile/${p.id}`} style={{ fontWeight: 700 }}>{p.displayName}</Link><span className="small muted">{p.headline} · {u.email} · {p.visibility}</span></div><span className="small muted">{date(p.updatedAt)}</span></div>
            {p.mandates && <p className="small" style={{ whiteSpace: "pre-line" }}><b>Angegebene Mandate:</b> {p.mandates}</p>}
            <Decide kind="profile" id={p.id} />
          </div>
        ))}

        <h2 className="h3">VR-Mandate ({mandates.length})</h2>
        {mandates.length === 0 && <p className="muted">Keine VR-Mandate in Prüfung.</p>}
        {mandates.map(({ m, u }) => (
          <div className="adrow" key={m.id}>
            <div className="adrow-head"><div className="stack" style={{ gap: 4 }}><Link href={`/verwaltungsraete/mandate/${mandateNo(m.id)}`} style={{ fontWeight: 700 }}>{mandateNo(m.id)} · {m.title}</Link><span className="small muted">{BOARD_ROLE_LABEL[m.role]} · {m.companyName} ({m.companyUid}) · {u.email}{m.orgId ? " · im Auftrag eines Partners" : ""}</span></div><span className="small muted">{date(m.updatedAt)}</span></div>
            <a className="small" href={`https://www.zefix.ch/de/search/entity/list?name=${encodeURIComponent(m.companyUid)}`} target="_blank" rel="noopener noreferrer">Im Handelsregister prüfen (Zefix)</a>
            <Decide kind="mandate" id={m.id} />
          </div>
        ))}

        <h2 className="h3">Mustereinträge</h2>
        <div className="notice neutral" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ flex: "1 1 320px" }}><b>{so.length} Musterpartner · {sp.length} Musterprofile · {sm.length} Mustermandate</b> – fiktiv und überall gekennzeichnet. Echte Einträge stehen immer davor.</span>
          {(so.length === 0 || sp.length === 0 || sm.length === 0) && <form action={createExtSamplesAction}><button className="btn btn-red" style={{ minHeight: 40 }}>Fehlende Muster anlegen</button></form>}
        </div>
        {([["org", "Musterpartner", so], ["profile", "Musterprofile", sp], ["mandate", "Mustermandate", sm]] as const).map(([k, label, rows]) => rows.length > 0 && (
          <div className="adrow" key={k}>
            <div className="adrow-head"><b>{label} ({rows.length})</b><form action={deleteExtSamplesAction}><input type="hidden" name="kind" value={k} /><ConfirmButton className="btn btn-ghost" question={`Alle ${label} löschen?`}>Alle löschen</ConfirmButton></form></div>
            {rows.map((r) => (
              <div key={r.id} className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <span className="small">{r.label}</span>
                <form action={deleteExtSampleAction}><input type="hidden" name="kind" value={k} /><input type="hidden" name="id" value={r.id} /><button className="btn btn-ghost" style={{ minHeight: 36 }}>Löschen</button></form>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
