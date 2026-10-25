import Link from "next/link";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { Card } from "@/components/ListingCards";
import ConfirmButton from "@/components/ConfirmButton";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import type { Listing, Subscription } from "@/lib/db/schema";
import { chf, date, listingNo } from "@/lib/format";
import { PLANS, PAID_PLANS, planName, type PaidPlan } from "@/lib/plans";
import { logout } from "@/app/auth-actions";
import { cancelAction, deleteAction, pauseAction, payAction, resumeAction, soldAction } from "./actions";
import { mandateNo, myProfile } from "@/lib/board";
import { myOrgs, orgMembersOf } from "@/lib/orgs";
import { BOARD_ROLE_LABEL, ORG_KIND_LABEL } from "@/lib/taxonomy";
import { deleteProfileAction, endMandateAction, profileVisibleAction } from "@/app/verwaltungsraete/actions";
import { addMemberAction, removeMemberAction } from "@/app/partner/actions";
import { OrgLogo } from "@/components/BoardCards";
import type { BoardMandate, Inquiry } from "@/lib/db/schema";

export const metadata = { title: "Mein Bereich" };
export const dynamic = "force-dynamic";

const OK: Record<string, string> = {
  pausiert: "Angebot pausiert. Es wird nichts belastet, bis Sie fortsetzen.",
  fortgesetzt: "Angebot fortgesetzt.",
  gekuendigt: "Gekündigt. Das Angebot bleibt bis zum Ende der Laufzeit online, danach endet es ohne weitere Belastung.",
  verkauft: "Als verkauft markiert. Herzlichen Glückwunsch! Es erfolgt keine weitere Belastung.",
  geloescht: "Angebot gelöscht.",
  gespeichert: "Änderungen gespeichert. Wir prüfen das Angebot persönlich und schalten es wieder frei.",
  passwort: "Ihr neues Passwort ist gespeichert.",
  "partner-eingereicht": "Partnerprofil eingereicht. Wir prüfen es persönlich und melden uns per E-Mail.",
  "partner-gespeichert": "Änderungen gespeichert. Wir prüfen das Partnerprofil und schalten es wieder frei.",
  mitglied: "Person hinzugefügt und per E-Mail informiert.",
  entfernt: "Person entfernt.",
  "profil-eingereicht": "VR-Profil gespeichert. Wir prüfen es persönlich und schalten es frei.",
  "mandat-eingereicht": "VR-Mandat eingereicht. Wir prüfen es persönlich und schalten es frei.",
  "mandat-beendet": "VR-Mandat beendet.",
  "profil-geloescht": "Ihr VR-Profil ist gelöscht.",
};
const ERR: Record<string, string> = {
  zahlung: "Die Zahlungsseite konnte nicht geöffnet werden. Bitte später erneut versuchen.",
  "zahlung-inaktiv": "Die Online-Zahlung ist noch nicht eingerichtet.",
  "nicht-gefunden": "Angebot nicht gefunden.",
  "kein-konto": "Zu dieser E-Mail-Adresse gibt es noch kein Konto. Bitten Sie die Person, sich zuerst kostenlos zu registrieren.",
  "keine-rechte": "Dafür braucht es Administrator-Rechte im Partnerprofil.",
  selbst: "Sie können sich nicht selbst entfernen.",
};

const RSTATE: Record<string, [string, string]> = {
  in_review: ["state-rev", "In Prüfung"], online: ["state-on", "Online"], paused: ["state-rev", "Pausiert"], expired: ["state-rev", "Beendet"], rejected: ["state-rev", "Nicht freigeschaltet"],
};

function MandateRow({ m, req }: { m: BoardMandate; req: number }) {
  const st = RSTATE[m.status];
  return (
    <div className="adrow">
      <div className="adrow-head">
        <div className="stack" style={{ gap: 4 }}>
          <Link href={`/verwaltungsraete/mandate/${mandateNo(m.id)}`} style={{ fontSize: 17, fontWeight: 700, textDecoration: "none" }}>{m.title}</Link>
          <span className="small muted">{mandateNo(m.id)} · {BOARD_ROLE_LABEL[m.role]} · Beta: kostenlos</span>
        </div>
        <span className={`pill ${st[0]}`}>{st[1]}</span>
      </div>
      {m.publishedAt && <div className="adrow-stats"><span><b>{m.views}</b> Aufrufe</span><span><b>{req}</b> Anfragen</span></div>}
      {m.status === "rejected" && <p className="small">Grund: {m.rejectionReason ?? "–"} Bitte passen Sie das Mandat an.</p>}
      <div className="row" style={{ gap: 8 }}>
        {m.status !== "expired" && <Link className="btn btn-ghost" style={{ minHeight: 40 }} href={`/verwaltungsraete/mandat-inserieren?id=${m.id}`}>Bearbeiten</Link>}
        {(m.status === "online" || m.status === "in_review") && <form action={endMandateAction}><input type="hidden" name="id" value={m.id} /><ConfirmButton className="btn btn-ghost" question="Mandat beenden? Es ist danach nicht mehr sichtbar.">Beenden (besetzt)</ConfirmButton></form>}
      </div>
    </div>
  );
}

function InquiryList({ rows }: { rows: { i: Inquiry; sender: { firstName: string; lastName: string; email: string; phone: string | null }; label: string; href: string }[] }) {
  return (
    <>
      {rows.map(({ i, sender, label, href }) => (
        <div className="msg" key={i.id}>
          <div className="msg-head">
            <span><b>{sender.firstName} {sender.lastName}</b> <span className="small muted">· zu <Link href={href}>{label}</Link></span></span>
            <span className="small muted">{date(i.createdAt)}{!i.readAt && <span className="chip red" style={{ marginLeft: 6 }}>Neu</span>}</span>
          </div>
          <p style={{ whiteSpace: "pre-line" }}>{i.message}</p>
          <p className="small muted"><a href={`mailto:${sender.email}`}>{sender.email}</a>{sender.phone ? ` · ${sender.phone}` : ""}</p>
        </div>
      ))}
    </>
  );
}

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
  else if (l.status === "in_review") term = sub?.periodEnd ? `Änderungen in Prüfung. Laufzeit bis ${date(sub.periodEnd)}.` : "Wir prüfen Ihre Angaben und den Handelsregistereintrag persönlich, in der Regel innerhalb eines Werktags. Die Laufzeit beginnt mit der Freischaltung.";
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
  const tabs: [string, string][] = [["inserate", "Meine Angebote"], ["anfragen", "Anfragen"], ["merkliste", "Merkliste"], ["vr", "Verwaltungsrat"], ["partner", "Partner"]];

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
  let extra: React.ComponentProps<typeof InquiryList>["rows"] = [];
  if (tab === "anfragen") {
    const sent = await db.select({ r: schema.contactRequests, l: schema.listings })
      .from(schema.contactRequests).innerJoin(schema.listings, eq(schema.listings.id, schema.contactRequests.listingId))
      .where(eq(schema.contactRequests.senderId, user.id)).orderBy(desc(schema.contactRequests.createdAt));
    // Anfragen zu eigenen VR-Mandaten, eigenem VR-Profil und Partnerprofilen (als Administrator)
    const [ownMandates, prof, orgsOf] = await Promise.all([
      db.select({ id: schema.boardMandates.id, title: schema.boardMandates.title }).from(schema.boardMandates).where(eq(schema.boardMandates.ownerId, user.id)),
      myProfile(user.id),
      myOrgs(user.id),
    ]);
    const adminOrgs = orgsOf.filter((x) => x.role === "admin").map((x) => x.org);
    const conds = [
      ...(ownMandates.length ? [and(eq(schema.inquiries.kind, "mandate"), inArray(schema.inquiries.targetId, ownMandates.map((m) => m.id)))!] : []),
      ...(prof ? [and(eq(schema.inquiries.kind, "profile"), eq(schema.inquiries.targetId, prof.id))!] : []),
      ...(adminOrgs.length ? [and(eq(schema.inquiries.kind, "org"), inArray(schema.inquiries.targetId, adminOrgs.map((o) => o.id)))!] : []),
    ];
    const inq = conds.length
      ? await db.select({ i: schema.inquiries, sender: schema.users }).from(schema.inquiries).innerJoin(schema.users, eq(schema.users.id, schema.inquiries.senderId)).where(or(...conds)).orderBy(desc(schema.inquiries.createdAt))
      : [];
    extra = inq.map(({ i, sender }) => {
      if (i.kind === "mandate") { const m = ownMandates.find((x) => x.id === i.targetId); return { i, sender, label: `VR-Mandat «${m?.title}»`, href: `/verwaltungsraete/mandate/${mandateNo(i.targetId)}` }; }
      if (i.kind === "profile") return { i, sender, label: "Ihr VR-Profil", href: `/verwaltungsraete/profile/${i.targetId}` };
      const o = adminOrgs.find((x) => x.id === i.targetId); return { i, sender, label: `Partnerprofil ${o?.name}`, href: `/partner/${o?.slug}` };
    });
    const unreadInq = inq.filter((x) => !x.i.readAt).map((x) => x.i.id);
    if (unreadInq.length) await db.update(schema.inquiries).set({ readAt: new Date() }).where(inArray(schema.inquiries.id, unreadInq));
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
        {extra.length > 0 && <><h2 className="h3">Zu VR-Mandaten, VR-Profil und Partnerprofil</h2><InquiryList rows={extra} /></>}
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
  } else if (tab === "vr") {
    const [prof, mandates] = await Promise.all([
      myProfile(user.id),
      db.select().from(schema.boardMandates).where(eq(schema.boardMandates.ownerId, user.id)).orderBy(desc(schema.boardMandates.createdAt)),
    ]);
    const reqCounts = mandates.length
      ? await db.select({ t: schema.inquiries.targetId, n: sql<number>`count(*)` }).from(schema.inquiries).where(and(eq(schema.inquiries.kind, "mandate"), inArray(schema.inquiries.targetId, mandates.map((m) => m.id)))).groupBy(schema.inquiries.targetId)
      : [];
    body = (
      <>
        <h2 className="h3">Mein VR-Profil</h2>
        {prof ? (
          <div className="adrow">
            <div className="adrow-head">
              <div className="stack" style={{ gap: 4 }}>
                <Link href={`/verwaltungsraete/profile/${prof.id}`} style={{ fontSize: 17, fontWeight: 700, textDecoration: "none" }}>{prof.headline}</Link>
                <span className="small muted">{prof.visibility === "public" ? "Öffentlich" : prof.visibility === "members" ? "Name nur für Angemeldete" : "Anonym"} · Beta: kostenlos</span>
              </div>
              <span className={`pill ${RSTATE[prof.status][0]}`}>{RSTATE[prof.status][1]}</span>
            </div>
            {prof.publishedAt && <div className="adrow-stats"><span><b>{prof.views}</b> Aufrufe</span></div>}
            {prof.status === "rejected" && <p className="small">Grund: {prof.rejectionReason ?? "–"}</p>}
            <div className="row" style={{ gap: 8 }}>
              <Link className="btn btn-ghost" style={{ minHeight: 40 }} href="/verwaltungsraete/mein-profil">Bearbeiten</Link>
              {prof.status === "online" && <form action={profileVisibleAction}><input type="hidden" name="pause" value="1" /><button className="btn btn-ghost" style={{ minHeight: 40 }}>Pausieren</button></form>}
              {prof.status === "paused" && <form action={profileVisibleAction}><input type="hidden" name="pause" value="0" /><button className="btn btn-red" style={{ minHeight: 40 }}>Wieder sichtbar machen</button></form>}
              <form action={deleteProfileAction}><ConfirmButton className="btn btn-ghost" question="VR-Profil endgültig löschen? Das lässt sich nicht rückgängig machen.">Löschen</ConfirmButton></form>
            </div>
          </div>
        ) : (
          <div className="empty"><p className="muted">Sie suchen ein Verwaltungsratsmandat? Mit einem Profil finden Firmen Sie.</p><Link className="btn btn-red" href="/verwaltungsraete/mein-profil">VR-Profil erstellen</Link></div>
        )}
        <h2 className="h3">Meine VR-Mandate</h2>
        {mandates.length === 0 && <p className="muted">Sie haben noch kein VR-Mandat inseriert.</p>}
        {mandates.map((m) => <MandateRow key={m.id} m={m} req={Number(reqCounts.find((x) => x.t === m.id)?.n ?? 0)} />)}
        <Link className="btn btn-red" href="/verwaltungsraete/mandat-inserieren" style={{ alignSelf: "flex-start" }}>VR-Mandat inserieren</Link>
      </>
    );
  } else if (tab === "partner") {
    const mine = await myOrgs(user.id);
    const blocks = await Promise.all(mine.map(async ({ org, role }) => {
      const [members, ls] = await Promise.all([
        orgMembersOf(org.id),
        db.select({ id: schema.listings.id, title: schema.listings.title, status: schema.listings.status }).from(schema.listings).where(eq(schema.listings.orgId, org.id)).orderBy(desc(schema.listings.createdAt)),
      ]);
      return { org, role, members, ls };
    }));
    body = (
      <>
        {blocks.length === 0 && (
          <div className="empty">
            <h2 className="h3">Noch kein Partnerprofil</h2>
            <p className="muted">Für Berater, M&amp;A-Firmen, Treuhänder, Startup-Förderer und Investoren: Profil im Partnerverzeichnis und Inserate im Auftrag Ihrer Kunden. Während der Beta kostenlos.</p>
            <Link className="btn btn-red" href="/partner/neu">Partnerprofil erstellen</Link>
          </div>
        )}
        {blocks.map(({ org, role, members, ls }) => (
          <div className="adrow" key={org.id}>
            <div className="adrow-head">
              <div className="row" style={{ gap: 12, flexWrap: "nowrap", minWidth: 0 }}>
                <OrgLogo name={org.name} size={44} />
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <Link href={`/partner/${org.slug}`} style={{ fontSize: 17, fontWeight: 700, textDecoration: "none" }}>{org.name}</Link>
                  <span className="small muted">{ORG_KIND_LABEL[org.kind]} · Ihre Rolle: {role === "admin" ? "Administrator" : "Mitglied"}</span>
                </div>
              </div>
              <span className={`pill ${RSTATE[org.status][0]}`}>{RSTATE[org.status][1]}</span>
            </div>
            {org.status === "rejected" && <p className="small">Grund: {org.rejectionReason ?? "–"}</p>}
            <p className="small"><b>Inserate im Auftrag ({ls.length}):</b> {ls.length ? ls.map((l, i) => <span key={l.id}>{i > 0 && " · "}<Link href={`/inserate/${listingNo(l.id)}`}>{l.title}</Link></span>) : "noch keine"}</p>
            <div className="row" style={{ gap: 8 }}>
              {org.status === "online" && <Link className="btn btn-red" style={{ minHeight: 40 }} href="/inserat-aufgeben">Inserat im Auftrag erstellen</Link>}
              {org.status === "online" && <Link className="btn btn-line" style={{ minHeight: 40 }} href="/verwaltungsraete/mandat-inserieren">VR-Mandat im Auftrag</Link>}
              {role === "admin" && <Link className="btn btn-ghost" style={{ minHeight: 40 }} href={`/partner/${org.slug}/bearbeiten`}>Profil bearbeiten</Link>}
            </div>
            <div className="stack" style={{ gap: 8 }}>
              <span className="fact-l">Team ({members.length})</span>
              {members.map(({ m, u }) => (
                <div key={u.id} className="row" style={{ gap: 8, justifyContent: "space-between" }}>
                  <span className="small">{u.firstName} {u.lastName} · {u.email} · {m.role === "admin" ? "Administrator" : "Mitglied"}</span>
                  {role === "admin" && u.id !== user.id && <form action={removeMemberAction}><input type="hidden" name="orgId" value={org.id} /><input type="hidden" name="userId" value={u.id} /><ConfirmButton className="btn btn-ghost" question={`${u.firstName} ${u.lastName} entfernen?`}>Entfernen</ConfirmButton></form>}
                </div>
              ))}
              {role === "admin" && (
                <form action={addMemberAction} className="row" style={{ gap: 8 }}>
                  <input type="hidden" name="orgId" value={org.id} />
                  <input name="email" type="email" required placeholder="E-Mail einer registrierten Person" aria-label="E-Mail" style={{ height: 40, border: "1px solid #B9B9B4", borderRadius: 8, padding: "0 10px", minWidth: 240, flex: "1 1 240px" }} />
                  <select name="role" aria-label="Rolle" defaultValue="member" style={{ height: 40, border: "1px solid #B9B9B4", borderRadius: 8, padding: "0 8px" }}><option value="member">Mitglied</option><option value="admin">Administrator</option></select>
                  <button className="btn btn-line" style={{ minHeight: 40 }}>Hinzufügen</button>
                </form>
              )}
            </div>
          </div>
        ))}
        {blocks.length > 0 && <Link className="btn btn-ghost" href="/partner/neu" style={{ alignSelf: "flex-start" }}>Weiteres Partnerprofil erstellen</Link>}
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
