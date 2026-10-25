import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { date } from "@/lib/format";
import { CONTACT_TOPICS, contactNo, topicById } from "@/lib/contact";
import { setContactStatusAction } from "./actions";

export const metadata = { title: "Kontaktanfragen", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminContactPage({ searchParams }: { searchParams: Promise<{ status?: string; thema?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status === "done" ? "done" : "new";
  const thema = topicById(sp.thema ?? "")?.id;
  const C = schema.contactMessages;
  const [counts, rows] = await Promise.all([
    db.select({ s: C.status, n: sql<number>`count(*)` }).from(C).groupBy(C.status),
    db.select().from(C).where(thema ? sql`${C.status} = ${status} and find_in_set(${thema}, ${C.topic})` : eq(C.status, status)).orderBy(desc(C.createdAt)).limit(200),
  ]);
  const n = (s: string) => Number(counts.find((c) => c.s === s)?.n ?? 0);
  const q = (o: Record<string, string | undefined>) => "/admin/kontakt?" + new URLSearchParams(Object.entries({ status, thema, ...o }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
          <h1 className="h2">Kontaktanfragen</h1>
          <Link className="btn btn-line" href="/admin">Zurück zum Admin</Link>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <Link className={`check-chip${status === "new" ? " on" : ""}`} href={q({ status: "new" })}>Offen ({n("new")})</Link>
          <Link className={`check-chip${status === "done" ? " on" : ""}`} href={q({ status: "done" })}>Erledigt ({n("done")})</Link>
          <span style={{ width: 12 }} />
          <Link className={`check-chip${!thema ? " on" : ""}`} href={q({ thema: "" })}>Alle Themen</Link>
          {CONTACT_TOPICS.map((t) => <Link key={t.id} className={`check-chip${thema === t.id ? " on" : ""}`} href={q({ thema: t.id })}>{t.label}</Link>)}
        </div>
        {rows.length === 0 && <p className="muted">Keine Anfragen.</p>}
        {rows.map((r) => {
          const details: Record<string, string> = r.details ? JSON.parse(r.details) : {};
          return (
            <article key={r.id} className="contact-card stack" style={{ gap: 10, background: "var(--bg)", borderColor: "var(--line)" }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span className="row" style={{ gap: 10 }}>{r.topic.split(",").map((id) => <span key={id} className="pill cap">{topicById(id)?.label ?? id}</span>)}<b>{r.subject}</b></span>
                <span className="small muted">{contactNo(r.id)} · {date(r.createdAt)}</span>
              </div>
              <p className="small"><b>{r.name}</b>{r.company ? ` · ${r.company}` : ""} · <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.subject} (${contactNo(r.id)})`)}`}>{r.email}</a>{r.phone ? ` · ${r.phone}` : ""}{r.userId ? " · mit Konto" : ""}</p>
              {Object.keys(details).length > 0 && <p className="small muted">{Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>}
              <p style={{ whiteSpace: "pre-wrap" }}>{r.message}</p>
              <form action={setContactStatusAction} className="row" style={{ gap: 8 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="done" value={r.status === "new" ? "1" : "0"} />
                <a className="btn btn-red" style={{ minHeight: 40 }} href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.subject} (${contactNo(r.id)})`)}`}>Antworten</a>
                <button className="btn btn-line" style={{ minHeight: 40 }}>{r.status === "new" ? "Als erledigt markieren" : "Wieder öffnen"}</button>
              </form>
            </article>
          );
        })}
      </div>
    </section>
  );
}
