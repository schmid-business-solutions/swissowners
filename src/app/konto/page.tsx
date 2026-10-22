import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { Card } from "@/components/ListingCards";
import ConfirmButton from "@/components/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import type { Listing, Subscription } from "@/lib/db/schema";
import { chf, date, listingNo } from "@/lib/format";
import { PLANS, PAID_PLANS, planName, type PaidPlan } from "@/lib/plans";
import { logout } from "@/app/auth-actions";
import { cancelAction, deleteAction, pauseAction, payAction, resumeAction, soldAction } from "./actions";

export const metadata = { title: "Mein Bereich" };
export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  pausiert: "Angebot pausiert. Es wird nichts belastet, bis Sie fortsetzen.",
  fortgesetzt: "Angebot fortgesetzt.",
  gekuendigt: "Gekündigt. Das Angebot bleibt bis zum Ende der Laufzeit online, danach endet es ohne weitere Belastung.",
  verkauft: "Als verkauft markiert. Herzlichen Glückwunsch! Es erfolgt keine weitere Belastung.",
  geloescht: "Angebot gelöscht.",
  gespeichert: "Änderungen gespeichert. Wir prüfen das Angebot und schalten es wieder frei.",
  passwort: "Ihr neues Passwort ist gespeichert.",
};
const ERR: Record<string, string> = {
  zahlung: "Die Zahlungsseite konnte nicht geöffnet werden. Bitte später erneut versuchen.",
  "zahlung-inaktiv": "Die Online-Zahlung ist noch nicht eingerichtet.",
  "nicht-gefunden": "Angebot nicht gefunden.",
};

const STATE: Record<string, [string, string]> = {
  draft: ["state-rev", "Entwurf"], pending_payment: ["state-rev", "Zahlung ausstehend"], in_review: ["state-rev", "In Prüfung"],
  online: ["state-on", "Online"], paused: ["state-rev", "Pausiert"], expired: ["state-rev", "Beendet"], sold: ["state-on", "Verkauft"], rejected: ["state-rev", "Nicht freigeschaltet"],
};

function Hidden({ id }: { id: number }) { return <input type="hidden" name="id" value={id} />; }

function PlanPicker({ id, label, current }: { id: number; label: string; current?: string }) {
  return (
    <form action={payAction} className="row" style={{ gap: 8 }}>
      <Hidden id={id} />
      <select name="plan" defaultValue={current && current !== "start" ? current : "plus"} aria-label="Paket" style={{ height: 40, border: "1px solid #B9B9B4", borderRadius: 4, padding: "0 8px", fontWeight: 600 }}>
        {PAID_PLANS.map((p) => <option key={p} value={p}>{PLANS[p].name} · {chf(PLANS[p].first)} / 60 Tage</option>)}
      </select>
      <button className="btn btn-red" style={{ minHeight: 40 }}>{label}</button>
    </form>
  );
}

function AdRow({ l, sub, req }: { l: Listing; sub?: Subscription; req: number }) {
  const st = sub?.status === "past_due" ? ["state-rev", "Zahlung fehlgeschlagen"] : STATE[l.status];
  const paid = l.plan !== "start";
  const p = paid ? PLANS[l.plan as PaidPlan] : null;
  let term = "";
  if (l.status === "pending_payment") term = "Die Zahlung wurde noch nicht abgeschlossen. Das Angebot wird erst danach geprüft.";
  else if (l.status === "in_review") term = sub?.periodEnd ? `Änderungen in Prüfung. Laufzeit bis ${date(sub.periodEnd)}.` : "Wir prüfen Ihre Angaben und den Handelsregistereintrag, in der Regel innerhalb eines Werktags. Die Laufzeit beginnt mit der Freischaltung.";
  else if (l.status === "rejected") term = `Grund: ${l.rejectionReason ?? "–"} Bitte passen Sie das Angebot an.`;
  else if (sub?.status === "past_due") term = `Die automatische Verlängerung für ${chf(p?.renewal)} konnte nicht belastet werden. Das Angebot ist offline, bis Sie bezahlen.`;
  else if (l.status === "paused") term = `Pausiert: offline, es wird nichts belastet. Verbleibende Laufzeit ${sub?.pausedRemainingDays ?? 0} Tage. Die Pause endet nach spätestens 90 Tagen.`;
  else if (l.status === "sold") term = "Als verkauft markiert. Keine weitere Belastung.";
  else if (l.status === "expired") term = "Das Angebot ist beendet. Mit einem Paket können Sie es wieder aktivieren.";
  else if (l.status === "online" && !paid) term = `Startangebot: kostenlos bis ${date(sub?.periodEnd)}. Danach wählen Sie ein Paket oder das Angebot endet automatisch.`;
  else if (l.status === "online" && sub?.cancelAtPeriodEnd) term = `Gekündigt: online bis ${date(sub.periodEnd)}, danach endet es. Keine weitere Belastung.`;
  else if (l.status === "online") term = `Laufzeit bis ${date(sub?.periodEnd)}, danach automatische Verlängerung um 30 Tage für ${chf(p?.renewal)}. Erinnerung 5 Tage vorher.`;

  const editable = ["draft", "pending_payment", "in_review", "rejected", "online"].includes(l.status);
  return (
    <div className="adrow">
      <div className="adrow-head">
        <div className="stack" style={{ gap: 4 }}>
          <Link href={`/inserate/${listingNo(l.id)}`} style={{ fontSize: 17, fontWeight: 700, textDecoration: "none" }}>{l.title}</Link>
          <span className="small muted">{listingNo(l.id)} · {l.type === "sell" ? "Anteile verkaufen" : "Kapital gesucht"} · {paid ? `Paket ${p!.name} · ${chf(p!.renewal)} / 30 Tage` : "Startangebot (gratis)"}</span>
        </div>
        <span className={`pill ${st[0]}`}>{st[1]}</span>
      </div>
      {l.publishedAt && <div className="adrow-stats"><span><b>{l.views}</b> Aufrufe</span><span><b>{req}</b> Anfragen</span></div>}
      <p className="small">{term}</p>
      <div className="row" style={{ gap: 8 }}>
        {l.status === "pending_payment" && <PlanPicker id={l.id} label="Zahlung abschliessen" current={l.plan} />}
        {sub?.status === "past_due" && (
          <form action={payAction}><Hidden id={l.id} /><button className="btn btn-red" style={{ minHeight: 40 }}>Jetzt {chf(p?.renewal)} bezahlen</button></form>
        )}
        {l.status === "online" && !paid && <PlanPicker id={l.id} label="Paket wählen" />}
        {l.status === "expired" && <PlanPicker id={l.id} label="Wieder aktivieren" current={l.plan} />}
        {l.status === "online" && paid && !sub?.cancelAtPeriodEnd && (
          <>
            <form action={pauseAction}><Hidden id={l.id} /><button className="btn btn-line" style={{ minHeight: 40 }}>Pausieren</button></form>
            <form action={cancelAction}><Hidden id={l.id} /><ConfirmButton className="btn btn-line" question="Paket wirklich kündigen? Das Angebot bleibt bis zum Ende der Laufzeit online.">Kündigen</ConfirmButton></form>
          </>
        )}
        {l.status === "online" && sub?.cancelAtPeriodEnd && (
          <form action={resumeAction}><Hidden id={l.id} /><button className="btn btn-line" style={{ minHeight: 40 }}>Kündigung zurücknehmen</button></form>
        )}
        {l.status === "paused" && sub?.status === "paused" && (
          <>
            <form action={resumeAction}><Hidden id={l.id} /><button className="btn btn-red" style={{ minHeight: 40 }}>Fortsetzen</button></form>
            <form action={cancelAction}><Hidden id={l.id} /><ConfirmButton className="btn btn-line" question="Angebot wirklich beenden?">Beenden</ConfirmButton></form>
          </>
        )}
        {l.status === "online" && !paid && (
          <form action={cancelAction}><Hidden id={l.id} /><ConfirmButton className="btn btn-ghost" question="Angebot wirklich beenden?">Beenden</ConfirmButton></form>
        )}
        {(l.status === "online" || l.status === "paused") && (
          <form action={soldAction}><Hidden id={l.id} /><ConfirmButton className="btn btn-ghost" question="Als verkauft markieren? Das Angebot endet sofort, ohne weitere Belastung.">Als verkauft markieren</ConfirmButton></form>
        )}
        {editable && <Link className="btn btn-ghost" style={{ minHeight: 40 }} href={`/konto/inserate/${l.id}/bearbeiten`}>Bearbeiten</Link>}
        {!l.publishedAt && ["draft", "pending_payment", "rejected"].includes(l.status) && (
          <form action={deleteAction}><Hidden id={l.id} /><ConfirmButton className="btn btn-ghost" question="Angebot endgültig löschen?">Löschen</ConfirmButton></form>
        )}
      </div>
    </div>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string; err?: string }> }) {
  const user = await requireUser("/konto");
  const { tab = "inserate", ok, err } = await searchParams;
  const tabs: [string, string][] = [["inserate", "Meine Angebote"], ["anfragen", "Anfragen"], ["merkliste", "Merkliste"]];

  const myListings = await db.select().from(schema.listings).where(eq(schema.listings.ownerId, user.id)).orderBy(desc(schema.listings.createdAt));
  const ids = myListings.map((l) => l.id);
  const [subs, received] = ids.length
    ? await Promise.all([
        db.select().from(schema.subscriptions).where(inArray(schema.subscriptions.listingId, ids)),
        db.select({ r: schema.contactRequests, sender: schema.users, title: schema.listings.title, lid: schema.listings.id })
          .from(schema.contactRequests)
          .innerJoin(schema.users, eq(schema.users.id, schema.contactRequests.senderId))
          .innerJoin(schema.listings, eq(schema.listings.id, schema.contactRequests.listingId))
          .where(inArray(schema.contactRequests.listingId, ids))
          .orderBy(desc(schema.contactRequests.createdAt)),
      ])
    : [[], []];
  const unread = received.filter((x) => !x.r.readAt).length;

  let body: React.ReactNode = null;
  if (tab === "anfragen") {
    const sent = await db.select({ r: schema.contactRequests, l: schema.listings })
      .from(schema.contactRequests).innerJoin(schema.listings, eq(schema.listings.id, schema.contactRequests.listingId))
      .where(eq(schema.contactRequests.senderId, user.id)).orderBy(desc(schema.contactRequests.createdAt));
    if (unread > 0) {
      await db.update(schema.contactRequests).set({ readAt: new Date() }).where(inArray(schema.contactRequests.id, received.filter((x) => !x.r.readAt).map((x) => x.r.id)));
    }
    body = (
      <>
        <h2 className="h3">Erhalten</h2>
        {received.length === 0 && <p className="muted">Noch keine Anfragen zu Ihren Angeboten.</p>}
        {received.map(({ r, sender, title, lid }) => (
          <div className="msg" key={r.id}>
            <div className="msg-head">
              <span><b>{sender.firstName} {sender.lastName}</b> <span className="small muted">· zu «{title}» ({listingNo(lid)})</span></span>
              <span className="small muted">{date(r.createdAt)}{!r.readAt && <span className="chip red" style={{ marginLeft: 6 }}>Neu</span>}</span>
            </div>
            <p style={{ whiteSpace: "pre-line" }}>{r.message}</p>
            <p className="small muted">Vertraulichkeitserklärung unterzeichnet am {date(r.ndaAcceptedAt)} · <a href={`mailto:${sender.email}`}>{sender.email}</a>{sender.phone ? ` · ${sender.phone}` : ""}</p>
            <div className="row" style={{ gap: 8 }}><a className="btn btn-line" style={{ minHeight: 40 }} href={`mailto:${sender.email}?subject=${encodeURIComponent(`Ihre Anfrage zu ${listingNo(lid)}: ${title}`)}`}>Per E-Mail antworten</a></div>
          </div>
        ))}
        <h2 className="h3">Gesendet</h2>
        {sent.length === 0 && <p className="muted">Sie haben noch keine Anfragen gesendet.</p>}
        {sent.map(({ r, l }) => (
          <div className="msg" key={r.id}>
            <div className="msg-head"><Link href={`/inserate/${listingNo(l.id)}`}><b>{l.title}</b></Link><span className="small muted">{date(r.createdAt)}</span></div>
            <p className="small muted">Firma: {l.companyName} ({l.companyUid}) · Vertraulichkeitserklärung unterzeichnet</p>
          </div>
        ))}
      </>
    );
  } else if (tab === "merkliste") {
    const saved = await db.select({ l: schema.listings }).from(schema.savedListings)
      .innerJoin(schema.listings, eq(schema.listings.id, schema.savedListings.listingId))
      .where(eq(schema.savedListings.userId, user.id)).orderBy(desc(schema.savedListings.createdAt));
    const visible = saved.map((s) => s.l).filter((l) => l.status === "online");
    body = visible.length ? (
      <div className="grid g3">{visible.map((l) => <Card key={l.id} l={l} href={`/inserate/${listingNo(l.id)}`} />)}</div>
    ) : (
      <div className="empty"><p className="muted">Noch keine Angebote gemerkt. Tippen Sie auf einem Angebot auf «Angebot merken».</p><Link className="btn btn-line" href="/inserate">Angebote durchsuchen</Link></div>
    );
  } else {
    body = (
      <>
        {myListings.length === 0 && <p className="muted">Sie haben noch keine Angebote.</p>}
        {myListings.map((l) => (
          <AdRow key={l.id} l={l} sub={subs.find((s) => s.listingId === l.id)} req={received.filter((x) => x.lid === l.id).length} />
        ))}
        <Link className="btn btn-red" href="/inserat-aufgeben" style={{ alignSelf: "flex-start" }}>Neues Inserat aufgeben</Link>
      </>
    );
  }

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 22 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="h2">Mein Bereich</h1>
            <p className="muted">Angemeldet als {user.firstName} {user.lastName} · {user.email}{!user.emailVerifiedAt && <> · <Link href="/bestaetigen">E-Mail noch nicht bestätigt</Link></>}</p>
          </div>
          <form action={logout}><button className="btn btn-line">Abmelden</button></form>
        </div>
        {ok && OK[ok] && <p className="flash ok" role="status">{OK[ok]}</p>}
        {err && ERR[err] && <p className="flash err" role="alert">{ERR[err]}</p>}
        <div className="tabbar" role="tablist">
          {tabs.map(([k, label]) => (
            <Link key={k} role="tab" aria-selected={tab === k} href={`/konto?tab=${k}`} className="tablink">
              {label}{k === "anfragen" && unread > 0 && <span className="chip red" style={{ marginLeft: 4 }}>{unread}</span>}
            </Link>
          ))}
        </div>
        <div className="stack" style={{ gap: 16 }}>{body}</div>
        <p className="small muted">Pakete: {PAID_PLANS.map((k) => `${planName(k)} ${chf(PLANS[k].first)} (60 Tage), danach ${chf(PLANS[k].renewal)} / 30 Tage`).join(" · ")}</p>
      </div>
    </section>
  );
}
