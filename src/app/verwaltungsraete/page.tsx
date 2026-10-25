import Link from "next/link";
import { MandateCard, ProfileCard } from "@/components/BoardCards";
import SearchSwitch from "@/components/SearchSwitch";
import { getUser } from "@/lib/auth";
import { boardQuery, countBoard, mandateNo, parseBoardFilters, searchMandates, searchProfiles } from "@/lib/board";
import { BOARD_ROLE_LABEL, REGIONEN, VR_SKILLS } from "@/lib/taxonomy";

export const metadata = {
  title: "Verwaltungsräte",
  description: "VR-Mandate von Schweizer KMU und Startups – und Verwaltungsrätinnen und Verwaltungsräte, die ein neues Mandat suchen.",
};
export const dynamic = "force-dynamic";

export default async function BoardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = parseBoardFilters(await searchParams);
  const [user, counts] = await Promise.all([getUser(), countBoard()]);
  const mandates = f.view === "mandate" ? await searchMandates(f) : [];
  const profiles = f.view === "profile" ? await searchProfiles(f) : [];
  const n = f.view === "mandate" ? mandates.length : profiles.length;
  return (
    <section className="list-sec">
      <div className="wrap stack" style={{ gap: 24 }}>
        <SearchSwitch current="vr" />
        <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-end" }}>
          <div className="stack" style={{ gap: 6 }}>
            <h1 className="h2">Verwaltungsräte</h1>
            <p className="muted" style={{ maxWidth: "62ch" }}>Firmen suchen Verwaltungsrätinnen und Verwaltungsräte – und erfahrene Persönlichkeiten stellen sich für neue Mandate vor. Während der Beta kostenlos.</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn btn-line" href="/verwaltungsraete/mein-profil">Mein VR-Profil</Link>
            <Link className="btn btn-red" href="/verwaltungsraete/mandat-inserieren">VR-Mandat inserieren</Link>
          </div>
        </div>
        <div className="segsw" role="group" aria-label="Ansicht">
          <Link href={boardQuery({ ...f, view: "mandate" })} aria-pressed={f.view === "mandate"} role="button">Mandate <span style={{ opacity: 0.7, fontWeight: 500 }}>{counts.mandates}</span></Link>
          <Link href={boardQuery({ ...f, view: "profile" })} aria-pressed={f.view === "profile"} role="button">Verwaltungsräte <span style={{ opacity: 0.7, fontWeight: 500 }}>{counts.profiles}</span></Link>
        </div>
        <form className="filters filter-inline" method="get" action="/verwaltungsraete">
          {f.view === "profile" && <input type="hidden" name="ansicht" value="profile" />}
          <label className="field">Kompetenz
            <select name="kompetenz" defaultValue={f.skill}><option value="all">Alle Kompetenzen</option>{VR_SKILLS.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="field">Region
            <select name="region" defaultValue={f.region}><option value="all">Ganze Schweiz</option>{REGIONEN.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          {f.view === "mandate" ? (
            <>
              <label className="field">Funktion
                <select name="rolle" defaultValue={f.role}><option value="all">Alle Funktionen</option>{Object.entries(BOARD_ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </label>
              <label className="field">Firmenart
                <select name="seg" defaultValue={f.seg}><option value="all">KMU und Startups</option><option value="kmu">KMU</option><option value="startup">Startups</option></select>
              </label>
            </>
          ) : null}
          <label className="check" style={{ alignSelf: "end", minHeight: 48 }}><input type="checkbox" name="investor" value="1" defaultChecked={f.investor} /><span className="small">{f.view === "mandate" ? "Beteiligung möglich" : "Investiert auch"}</span></label>
          <button className="btn btn-red">Anzeigen</button>
        </form>
        <p className="small muted" aria-live="polite"><b style={{ color: "var(--ink)" }}>{n}</b> {f.view === "mandate" ? (n === 1 ? "Mandat" : "Mandate") : (n === 1 ? "Profil" : "Profile")} gefunden</p>
        {n > 0 ? (
          <div className="grid g3">
            {f.view === "mandate"
              ? mandates.map((m) => <MandateCard key={m.id} m={m} href={`/verwaltungsraete/mandate/${mandateNo(m.id)}`} />)
              : profiles.map((p) => <ProfileCard key={p.id} p={p} loggedIn={Boolean(user)} />)}
          </div>
        ) : (
          <div className="empty">
            <h2 className="h3">Nichts gefunden für diese Auswahl</h2>
            <p className="muted">Ändern Sie die Filter – oder werden Sie selbst sichtbar.</p>
            <div className="row" style={{ gap: 8, justifyContent: "center" }}>
              <Link className="btn btn-line" href={boardQuery({ view: f.view })}>Filter zurücksetzen</Link>
              <Link className="btn btn-red" href={f.view === "mandate" ? "/verwaltungsraete/mandat-inserieren" : "/verwaltungsraete/mein-profil"}>{f.view === "mandate" ? "Mandat inserieren" : "Profil erstellen"}</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
