"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { BoardMandate, BoardProfile } from "@/lib/db/schema";
import type { OrgOption } from "@/lib/wizard";
import { BOARD_ROLE_LABEL, BRANCHEN, KANTONE, KAPAZITAET, PHASEN, SPRACHEN, UMSATZKLASSEN, VISIBILITY_LABEL, VR_SKILLS, splitList } from "@/lib/taxonomy";
import { saveMandate, saveProfile } from "@/app/verwaltungsraete/actions";
import { Checks } from "./OrgForm";
import { Info } from "./Icons";

export function ProfileForm({ p, name }: { p?: BoardProfile; name: string }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const [investor, setInvestor] = useState(p?.investor ?? false);
  return (
    <form action={action} className="wizard">
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="h2">{p ? "Mein VR-Profil" : "VR-Profil erstellen"}</h1>
        <p className="muted">Stellen Sie sich Firmen vor, die eine Verwaltungsrätin oder einen Verwaltungsrat suchen. Das Profil erscheint unter Ihrem Namen <b>{name}</b> – oder anonym, wenn Sie das wählen. Während der Beta kostenlos.</p>
      </div>
      <div className="fgrid">
        <label className="field" style={{ gridColumn: "1/-1" }}>Titel<input name="headline" defaultValue={p?.headline} maxLength={160} required placeholder="z. B. Finanzexpertin, ehemalige CFO eines Industrie-KMU" /><span className="hint">Was Sie auszeichnet, in einem Satz</span></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Kurzporträt<textarea name="bio" defaultValue={p?.bio} maxLength={3000} required style={{ minHeight: 130 }} placeholder="Was Sie in einen Verwaltungsrat einbringen und welche Firmen Sie suchen – mindestens 80 Zeichen" /></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Werdegang<textarea name="experience" defaultValue={p?.experience} maxLength={3000} required placeholder="Wichtigste Stationen, Ausbildung, VR-Ausbildungen" /></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Heutige Mandate (optional)<textarea name="mandates" defaultValue={p?.mandates ?? ""} maxLength={2000} placeholder={"Eine Zeile pro Mandat, z. B.\nVR-Mitglied, Holzbau-KMU (Bern)"} /><span className="hint">Firmennamen sind freiwillig. Wir gleichen genannte Mandate mit dem Handelsregister ab.</span></label>
        <label className="field">Kanton (Wohnort)<select name="kanton" defaultValue={p?.kanton ?? ""} required><option value="">Bitte wählen</option>{KANTONE.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="field">Verfügbarkeit<select name="capacity" defaultValue={p?.capacity ?? ""} required><option value="">Bitte wählen</option>{KAPAZITAET.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="field">Entschädigung (optional)<input name="fee" defaultValue={p?.fee ?? ""} maxLength={120} placeholder="z. B. ab CHF 15'000 pro Jahr" /></label>
        <label className="field">LinkedIn (optional)<input name="linkedin" defaultValue={p?.linkedin ?? ""} maxLength={200} placeholder="linkedin.com/in/…" /></label>
      </div>
      <div className="stack" style={{ gap: 10 }}><h2 className="h3">Kompetenzen <span className="small muted" style={{ fontWeight: 500 }}>(1 bis 6)</span></h2><Checks name="skills" options={VR_SKILLS} selected={splitList(p?.skills)} max={6} /></div>
      <div className="stack" style={{ gap: 10 }}><h2 className="h3">Sprachen</h2><Checks name="languages" options={SPRACHEN} selected={p ? splitList(p.languages) : ["Deutsch"]} /></div>
      <details className="stack" style={{ gap: 10 }} open={Boolean(p?.branchen)}>
        <summary className="h3" style={{ cursor: "pointer" }}>Branchenerfahrung (optional, bis 6)</summary>
        <Checks name="branchen" options={BRANCHEN.filter((b) => b !== "Andere Branche")} selected={splitList(p?.branchen)} max={6} />
      </details>
      <label className="check"><input type="checkbox" name="investor" checked={investor} onChange={(e) => setInvestor(e.target.checked)} /><span>Ich beteilige mich auch finanziell <span className="small muted" style={{ display: "block" }}>Firmen, die Kapital suchen, finden Sie dann als «Investor mit VR-Erfahrung».</span></span></label>
      {investor && <label className="field">Ticketgrösse<input name="ticket" defaultValue={p?.ticket ?? ""} maxLength={120} placeholder="z. B. CHF 50'000–250'000" /></label>}
      <fieldset className="stack" style={{ gap: 8, border: 0, padding: 0, margin: 0 }}>
        <legend className="h3" style={{ marginBottom: 8 }}>Sichtbarkeit</legend>
        {(Object.entries(VISIBILITY_LABEL) as [keyof typeof VISIBILITY_LABEL, string][]).map(([k, v]) => (
          <label key={k} className="check"><input type="radio" name="visibility" value={k} defaultChecked={(p?.visibility ?? "members") === k} /><span className="small">{v}</span></label>
        ))}
      </fieldset>
      <label className="check"><input type="checkbox" name="confirm" required /><span className="small">Meine Angaben sind korrekt. Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link>.</span></label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div className="wiz-nav">
        <Link className="btn btn-ghost" href={p ? "/konto?tab=vr" : "/verwaltungsraete?ansicht=profile"}>Abbrechen</Link>
        <button className="btn btn-red" disabled={pending}>{pending ? "Bitte warten …" : p ? "Speichern und zur Prüfung" : "Profil einreichen"}</button>
      </div>
    </form>
  );
}

export function MandateForm({ m, orgs }: { m?: BoardMandate; orgs: OrgOption[] }) {
  const [state, action, pending] = useActionState(saveMandate.bind(null, m?.id ?? null), undefined);
  const [segment, setSegment] = useState<string>(m?.segment ?? "kmu");
  const [orgId, setOrgId] = useState<string>(m?.orgId ? String(m.orgId) : "");
  return (
    <form action={action} className="wizard">
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="h2">{m ? "VR-Mandat bearbeiten" : "VR-Mandat inserieren"}</h1>
        <p className="muted">Sie suchen eine Verwaltungsrätin, einen Verwaltungsrat oder einen Beirat? Der Firmenname bleibt verborgen, bis eine interessierte Person Vertraulichkeit bestätigt. Während der Beta kostenlos, Laufzeit 60 Tage.</p>
      </div>
      {orgs.length > 0 && (
        <div className="stack" style={{ gap: 10 }}>
          <label className="field">Inseriert durch
            <select name="orgId" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              <option value="">Mich bzw. meine Firma</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} (im Auftrag eines Kunden)</option>)}
            </select>
          </label>
          {orgId && <label className="check"><input type="checkbox" name="mandate" required defaultChecked={Boolean(m?.orgId)} /><span className="small">Ich bin von der Firma beauftragt, dieses Mandat zu inserieren, und kann den Auftrag auf Verlangen belegen.</span></label>}
        </div>
      )}
      <div className="fgrid">
        <label className="field">Funktion<select name="role" defaultValue={m?.role ?? ""} required><option value="">Bitte wählen</option>{Object.entries(BOARD_ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="field">Firmenart<select name="segment" value={segment} onChange={(e) => setSegment(e.target.value)}><option value="kmu">KMU</option><option value="startup">Startup</option></select></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Titel<input name="title" defaultValue={m?.title} maxLength={100} required placeholder="z. B. VR-Mitglied mit Finanzerfahrung für Familien-KMU" /><span className="hint">Ohne Firmenname, max. 100 Zeichen</span></label>
        <label className="field">Firmenname (verborgen)<input name="companyName" defaultValue={m?.companyName} maxLength={200} required autoComplete="organization" /></label>
        <label className="field">UID (verborgen)<input name="companyUid" defaultValue={m?.companyUid} required placeholder="CHE-123.456.789" /></label>
        <label className="field">Branche<select name="branche" defaultValue={m?.branche ?? ""} required><option value="">Bitte wählen</option>{BRANCHEN.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label className="field">Kanton (Sitz)<select name="kanton" defaultValue={m?.kanton ?? ""} required><option value="">Bitte wählen</option>{KANTONE.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label className="field">Umsatzklasse (optional)<select name="revenueClass" defaultValue={m?.revenueClass ?? ""}><option value="">Keine Angabe</option>{UMSATZKLASSEN.map((u) => <option key={u}>{u}</option>)}</select></label>
        <label className="field">Mitarbeitende (optional)<input name="employees" inputMode="numeric" defaultValue={m?.employees ?? ""} /></label>
        {segment === "startup" && <label className="field">Phase<select name="phase" defaultValue={m?.phase ?? ""}><option value="">Bitte wählen</option>{PHASEN.map((p) => <option key={p}>{p}</option>)}</select></label>}
        <label className="field">Aufwand<input name="effort" defaultValue={m?.effort} maxLength={160} required placeholder="z. B. 5 Sitzungen und rund 8 Tage pro Jahr" /></label>
        <label className="field">Entschädigung<input name="fee" defaultValue={m?.fee} maxLength={160} required placeholder="z. B. CHF 12'000–18'000 pro Jahr oder nach Vereinbarung" /></label>
        <label className="field">Start<input name="startAt" defaultValue={m?.startAt} maxLength={80} required placeholder="z. B. Generalversammlung Mai 2027" /></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Ausgangslage und Aufgabe<textarea name="description" defaultValue={m?.description} maxLength={4000} required style={{ minHeight: 150 }} placeholder="Was die Firma macht, wie der VR heute zusammengesetzt ist und welche Aufgabe die neue Person übernimmt – mindestens 80 Zeichen" /></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Anforderungen (optional)<textarea name="requirements" defaultValue={m?.requirements ?? ""} maxLength={2000} placeholder="z. B. Unabhängigkeit, Wohnsitz Schweiz, Erfahrung als VR-Präsident" /></label>
      </div>
      <div className="stack" style={{ gap: 10 }}><h2 className="h3">Gesuchte Kompetenzen <span className="small muted" style={{ fontWeight: 500 }}>(1 bis 5)</span></h2><Checks name="skills" options={VR_SKILLS} selected={splitList(m?.skills)} max={5} /></div>
      <div className="stack" style={{ gap: 10 }}><h2 className="h3">Sprachen</h2><Checks name="languages" options={SPRACHEN} selected={m ? splitList(m.languages) : ["Deutsch"]} /></div>
      <label className="check"><input type="checkbox" name="investWelcome" defaultChecked={m?.investWelcome} /><span>Eine finanzielle Beteiligung der neuen Person ist möglich</span></label>
      <div className="notice neutral small"><Info /><span>Interessierte melden sich über SwissOwners; Sie erhalten jede Anfrage per E-Mail und antworten direkt. Auswahl, Wahl durch die Generalversammlung und Vertrag liegen bei Ihnen.</span></div>
      <label className="check"><input type="checkbox" name="confirm" required /><span className="small">Ich bin berechtigt, dieses Mandat für die Firma zu inserieren, und akzeptiere die <Link href="/agb" target="_blank">AGB</Link>.</span></label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div className="wiz-nav">
        <Link className="btn btn-ghost" href={m ? "/konto?tab=vr" : "/verwaltungsraete"}>Abbrechen</Link>
        <button className="btn btn-red" disabled={pending}>{pending ? "Bitte warten …" : m ? "Speichern und zur Prüfung" : "Kostenlos einreichen"}</button>
      </div>
    </form>
  );
}
