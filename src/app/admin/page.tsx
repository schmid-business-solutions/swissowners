import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { LISTING_STATUS } from "@/lib/db/schema";
import { chf, date, listingNo } from "@/lib/format";
import { planName, type Plan } from "@/lib/plans";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  draft: "Entwurf", pending_payment: "Zahlung offen", in_review: "In Prüfung", online: "Online", paused: "Pausiert", expired: "Beendet", sold: "Verkauft", rejected: "Abgelehnt",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; ok?: string }> }) {
  await requireAdmin();
  const { status = "in_review", ok } = await searchParams;
  const st = (LISTING_STATUS as readonly string[]).includes(status) ? (status as (typeof LISTING_STATUS)[number]) : "in_review";
  const [counts, users, revenue, rows] = await Promise.all([
    db.select({ s: schema.listings.status, n: sql<number>`count(*)` }).from(schema.listings).groupBy(schema.listings.status),
    db.select({ n: sql<number>`count(*)` }).from(schema.users),
    db.select({ sum: sql<number>`coalesce(sum(${schema.payments.amountRappen}),0)` }).from(schema.payments).where(eq(schema.payments.status, "paid")),
    db.select({ l: schema.listings, owner: schema.users }).from(schema.listings)
      .innerJoin(schema.users, eq(schema.users.id, schema.listings.ownerId))
      .where(eq(schema.listings.status, st)).orderBy(desc(schema.listings.updatedAt)).limit(200),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x.s, Number(x.n)]));

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <h1 className="h2">Admin</h1>
        {ok && <p className="flash ok">{ok === "freigeschaltet" ? "Inserat freigeschaltet, Inserent informiert." : "Inserat abgelehnt, Inserent informiert."}</p>}
        <div className="admin-grid">
          <div className="statbox"><span className="small muted">Zur Prüfung</span><b>{c.in_review ?? 0}</b></div>
          <div className="statbox"><span className="small muted">Online</span><b>{c.online ?? 0}</b></div>
          <div className="statbox"><span className="small muted">Konten</span><b>{Number(users[0].n)}</b></div>
          <div className="statbox"><span className="small muted">Umsatz bezahlt</span><b>{chf(Math.round(Number(revenue[0].sum) / 100))}</b></div>
        </div>
        <div className="tabbar" role="tablist">
          {LISTING_STATUS.map((s) => (
            <Link key={s} className="tablink" role="tab" aria-selected={s === st} href={`/admin?status=${s}`}>{LABEL[s]} ({c[s] ?? 0})</Link>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nr.</th><th>Titel</th><th>Firma</th><th>Inserent</th><th>Paket</th><th>Geändert</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="muted">Keine Inserate in diesem Status.</td></tr>}
              {rows.map(({ l, owner }) => (
                <tr key={l.id}>
                  <td><Link href={`/admin/inserate/${l.id}`}>{listingNo(l.id)}</Link></td>
                  <td>{l.title}</td>
                  <td>{l.companyName}<br /><span className="small muted">{l.companyUid}</span></td>
                  <td>{owner.firstName} {owner.lastName}<br /><span className="small muted">{owner.email}</span></td>
                  <td>{planName(l.plan as Plan)}</td>
                  <td>{date(l.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
