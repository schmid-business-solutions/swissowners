import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import ConfirmButton from "@/components/ConfirmButton";
import { createSamplesAction, deleteAllSamplesAction, deleteOldestSampleAction, deleteSampleAction } from "./actions";
import { SAMPLE_LISTINGS } from "@/lib/samples";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { LISTING_STATUS } from "@/lib/db/schema";
import { chf, date, listingNo } from "@/lib/format";
import { planName, type Plan } from "@/lib/plans";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const OK_MSG: Record<string, string> = {
  freigeschaltet: "Angebot freigeschaltet, Inserent informiert. Tipp: Unter «Musterangebote» jetzt ein Muster löschen.",
  abgelehnt: "Angebot abgelehnt, Inserent informiert.",
  "muster-angelegt": "Musterangebote angelegt.",
  "muster-vorhanden": "Es sind bereits Musterangebote vorhanden.",
  "muster-geloescht": "Musterangebot gelöscht.",
  "muster-alle-geloescht": "Alle Musterangebote gelöscht.",
};

const LABEL: Record<string, string> = {
  draft: "Entwurf", pending_payment: "Zahlung offen", in_review: "In Prüfung", online: "Online", paused: "Pausiert", expired: "Beendet", sold: "Verkauft", rejected: "Abgelehnt",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; ok?: string }> }) {
  await requireAdmin();
  const { status = "in_review", ok } = await searchParams;
  const showSamples = status === "muster";
  const st = (LISTING_STATUS as readonly string[]).includes(status) ? (status as (typeof LISTING_STATUS)[number]) : "in_review";
  const L = schema.listings;
  const [counts, users, revenue, rows] = await Promise.all([
    db.select({ s: L.status, sample: L.isSample, n: sql<number>`count(*)` }).from(L).groupBy(L.status, L.isSample),
    db.select({ n: sql<number>`count(*)` }).from(schema.users),
    db.select({ sum: sql<number>`coalesce(sum(${schema.payments.amountRappen}),0)` }).from(schema.payments).where(eq(schema.payments.status, "paid")),
    db.select({ l: schema.listings, owner: schema.users }).from(schema.listings)
      .innerJoin(schema.users, eq(schema.users.id, schema.listings.ownerId))
      .where(showSamples ? eq(L.isSample, true) : and(eq(L.status, st), eq(L.isSample, false)))
      .orderBy(showSamples ? desc(L.publishedAt) : desc(L.updatedAt)).limit(200),
  ]);
  const c: Record<string, number> = {};
  let samples = 0;
  for (const x of counts) {
    if (x.sample) samples += Number(x.n);
    else c[x.s] = (c[x.s] ?? 0) + Number(x.n);
  }

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <h1 className="h2">Admin</h1>
        {ok && <p className="flash ok">{OK_MSG[ok] ?? "Erledigt."}</p>}
        <div className="admin-grid">
          <div className="statbox"><span className="small muted">Zur Prüfung</span><b>{c.in_review ?? 0}</b></div>
          <div className="statbox"><span className="small muted">Online (echt)</span><b>{c.online ?? 0}</b></div>
          <div className="statbox"><span className="small muted">Musterangebote</span><b>{samples}</b></div>
          <div className="statbox"><span className="small muted">Konten</span><b>{Number(users[0].n)}</b></div>
          <div className="statbox"><span className="small muted">Umsatz bezahlt</span><b>{chf(Math.round(Number(revenue[0].sum) / 100))}</b></div>
        </div>
        <div className="notice neutral" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ flex: "1 1 320px" }}>
            <b>Musterangebote: {samples}</b> · fiktive Beispiele, überall als «Musterangebot» gekennzeichnet. Echte Angebote stehen immer davor.
          </span>
          <span className="row" style={{ gap: 8 }}>
            {samples === 0 ? (
              <form action={createSamplesAction}><button className="btn btn-red" style={{ minHeight: 40 }}>{SAMPLE_LISTINGS.length} Musterangebote anlegen</button></form>
            ) : (
              <>
                {!showSamples && <Link className="btn btn-line" style={{ minHeight: 40 }} href="/admin?status=muster">Muster verwalten</Link>}
                <form action={deleteOldestSampleAction}><button className="btn btn-line" style={{ minHeight: 40 }}>Ältestes Muster löschen</button></form>
                {showSamples && <form action={deleteAllSamplesAction}><ConfirmButton className="btn btn-ghost" question={`Alle ${samples} Musterangebote endgültig löschen?`}>Alle löschen</ConfirmButton></form>}
              </>
            )}
          </span>
        </div>
        <div className="tabbar" role="tablist">
          {LISTING_STATUS.map((s) => (
            <Link key={s} className="tablink" role="tab" aria-selected={!showSamples && s === st} href={`/admin?status=${s}`}>{LABEL[s]} ({c[s] ?? 0})</Link>
          ))}
          <Link className="tablink" role="tab" aria-selected={showSamples} href="/admin?status=muster">Musterangebote ({samples})</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nr.</th><th>Titel</th><th>Firma</th><th>Inserent</th><th>Paket</th><th>{showSamples ? "Aktion" : "Geändert"}</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="muted">{showSamples ? "Keine Musterangebote vorhanden." : "Keine Angebote in diesem Status."}</td></tr>}
              {rows.map(({ l, owner }) => (
                <tr key={l.id}>
                  <td><Link href={`/admin/inserate/${l.id}`}>{listingNo(l.id)}</Link></td>
                  <td>{l.title}</td>
                  <td>{l.companyName}<br /><span className="small muted">{l.companyUid}</span></td>
                  <td>{owner.firstName} {owner.lastName}<br /><span className="small muted">{owner.email}</span></td>
                  <td>{planName(l.plan as Plan)}</td>
                  <td>{showSamples ? (
                    <form action={deleteSampleAction}><input type="hidden" name="id" value={l.id} /><button className="btn btn-ghost" style={{ minHeight: 36 }}>Löschen</button></form>
                  ) : date(l.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
