import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Card } from "@/components/ListingCards";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { chf, date, listingNo } from "@/lib/format";
import { approveAction, rejectAction } from "../../actions";

export const metadata = { title: "Angebot prüfen", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminListing({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const { err } = await searchParams;
  const [row] = await db.select({ l: schema.listings, owner: schema.users }).from(schema.listings)
    .innerJoin(schema.users, eq(schema.users.id, schema.listings.ownerId)).where(eq(schema.listings.id, id)).limit(1);
  if (!row) notFound();
  const { l, owner } = row;
  const [sub] = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.listingId, id)).limit(1);
  const pays = await db.select().from(schema.payments).where(eq(schema.payments.listingId, id)).orderBy(desc(schema.payments.createdAt));
  const zefix = `https://www.zefix.ch/de/search/entity/list?name=${encodeURIComponent(l.companyUid)}`;

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <nav className="crumbs"><Link href="/admin">Admin</Link><span>/</span><span>{listingNo(l.id)}</span></nav>
        <h1 className="h2">{l.title}</h1>
        <div className="detail">
          <div className="detail-main">
            <Card l={l} />
            <div className="stack" style={{ gap: 8 }}><h2 className="h3">Beschreibung</h2><p style={{ whiteSpace: "pre-line" }}>{l.description}</p></div>
            <div className="stack" style={{ gap: 8 }}><h2 className="h3">Grund</h2><p style={{ whiteSpace: "pre-line" }}>{l.reason}</p></div>
            <div className="stack" style={{ gap: 8 }}>
              <h2 className="h3">Prüfliste</h2>
              <ul className="small" style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                <li>Firma <b>{l.companyName}</b> mit UID <b>{l.companyUid}</b> im <a href={zefix} target="_blank" rel="noopener noreferrer">Handelsregister (Zefix)</a> aktiv? Sitz im Kanton {l.kanton}? Rechtsform {l.legalForm}?</li>
                <li>Bei Kapitalgesuch: Ist {owner.firstName} {owner.lastName} im Handelsregister als zeichnungsberechtigt eingetragen?</li>
                <li>Kein Firmenname im Titel oder in der Beschreibung? Keine Rendite-Versprechen oder öffentliche Werbung für Effekten?</li>
                <li>Angaben plausibel (Umsatz, Mitarbeitende, Preis)?</li>
              </ul>
            </div>
          </div>
          <aside className="detail-side">
            <span className="fact-l">Status</span><b>{l.status}</b>
            <span className="small">Inserent: {owner.firstName} {owner.lastName} · <a href={`mailto:${owner.email}`}>{owner.email}</a>{owner.phone ? ` · ${owner.phone}` : ""}<br />Konto seit {date(owner.createdAt)}{owner.emailVerifiedAt ? " · E-Mail bestätigt" : ""}</span>
            <span className="small">Paket: {l.plan}{sub?.periodEnd ? ` · Laufzeit bis ${date(sub.periodEnd)}` : ""}</span>
            {pays.length > 0 && <span className="small">Zahlungen: {pays.map((p) => `${chf(p.amountRappen / 100)} ${p.status} (${date(p.createdAt)})`).join(", ")}</span>}
            {l.status === "in_review" && (
              <>
                <form action={approveAction}><input type="hidden" name="id" value={l.id} /><button className="btn btn-red btn-block">Freischalten</button></form>
                <form action={rejectAction} className="stack" style={{ gap: 10 }}>
                  <input type="hidden" name="id" value={l.id} />
                  <label className="field">Grund für Ablehnung<textarea name="reason" placeholder="Wird dem Inserenten per E-Mail gesendet" /></label>
                  {err === "grund" && <p className="err">Bitte einen Grund angeben.</p>}
                  <button className="btn btn-line btn-block">Ablehnen</button>
                </form>
                {l.plan !== "start" && <p className="small muted">Bei Ablehnung eines bezahlten Angebots die Rückerstattung im Payrexx-Backend auslösen, falls der Inserent nicht korrigiert.</p>}
              </>
            )}
            <Link className="link" href={`/inserate/${listingNo(l.id)}`}>Öffentliche Ansicht</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
