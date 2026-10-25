"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { Org } from "@/lib/db/schema";
import { BRANCHEN, KANTONE, ORG_GROUPS, ORG_KIND_LABEL, ORG_SERVICES, SPRACHEN, orgGroupOf, splitList } from "@/lib/taxonomy";
import { saveOrg } from "@/app/partner/actions";

export function Checks({ name, options, selected, max }: { name: string; options: string[]; selected: string[]; max?: number }) {
  const [sel, setSel] = useState<string[]>(selected);
  return (
    <div className="checks">
      {options.map((o) => {
        const on = sel.includes(o);
        return (
          <label key={o} className={"check-chip" + (on ? " on" : "")}>
            <input type="checkbox" name={name} value={o} checked={on} disabled={!on && max != null && sel.length >= max}
              onChange={(e) => setSel((p) => (e.target.checked ? [...p, o] : p.filter((x) => x !== o)))} />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function OrgForm({ org }: { org?: Org }) {
  const [state, action, pending] = useActionState(saveOrg.bind(null, org?.id ?? null), undefined);
  const [kind, setKind] = useState<string>(org?.kind ?? "");
  const startup = kind ? orgGroupOf(kind) === "startup" : false;
  return (
    <form action={action} className="wizard">
      <div className="stack" style={{ gap: 8 }}>
        <h1 className="h2">{org ? "Partnerprofil bearbeiten" : "Partnerprofil erstellen"}</h1>
        <p className="muted">Für Berater, M&amp;A-Firmen, Treuhänder, Startup-Förderer und Investoren. Mit einem geprüften Profil inserieren Sie Angebote und VR-Mandate im Auftrag Ihrer Kunden. Während der Beta kostenlos.</p>
      </div>
      <div className="fgrid">
        <label className="field">Art der Organisation
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} required>
            <option value="">Bitte wählen</option>
            <optgroup label={ORG_GROUPS.berater.label}>{ORG_GROUPS.berater.kinds.map((k) => <option key={k} value={k}>{ORG_KIND_LABEL[k]}</option>)}</optgroup>
            <optgroup label={ORG_GROUPS.startup.label}>{ORG_GROUPS.startup.kinds.map((k) => <option key={k} value={k}>{ORG_KIND_LABEL[k]}</option>)}</optgroup>
          </select>
        </label>
        <label className="field">Name<input name="name" defaultValue={org?.name} maxLength={160} required autoComplete="organization" /></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Kurzbeschreibung<input name="tagline" defaultValue={org?.tagline} maxLength={160} required placeholder={startup ? "z. B. Wir begleiten Startups aus der Region vom ersten Businessplan bis zur Seed-Runde" : "z. B. Unternehmensverkauf und Nachfolge für KMU in der Ostschweiz"} /><span className="hint">Ein Satz, max. 160 Zeichen</span></label>
        <label className="field" style={{ gridColumn: "1/-1" }}>Beschreibung<textarea name="description" defaultValue={org?.description} maxLength={4000} required style={{ minHeight: 150 }} placeholder="Wer Sie sind, für wen Sie arbeiten, wie Sie vorgehen – mindestens 80 Zeichen" /></label>
        <label className="field">{startup ? "Fokus (Phase, Ticketgrösse)" : "Schwerpunkt (z. B. Dealgrösse)"}<input name="focus" defaultValue={org?.focus ?? ""} maxLength={200} placeholder={startup ? "z. B. Pre-Seed bis Series A, Tickets CHF 100'000–1 Mio." : "z. B. Firmenwert CHF 1–30 Mio."} /></label>
        <label className="field">UID (optional)<input name="uid" defaultValue={org?.uid ?? ""} placeholder="CHE-123.456.789" /><span className="hint">Für das Badge «Verifizierter Partner». Öffentliche Stellen ohne UID lassen das Feld leer.</span></label>
        <label className="field">Kanton
          <select name="kanton" defaultValue={org?.kanton ?? ""} required><option value="">Bitte wählen</option>{KANTONE.map((k) => <option key={k}>{k}</option>)}</select>
        </label>
        <label className="field">Ort<input name="city" defaultValue={org?.city} maxLength={80} required /></label>
        <label className="field">Website<input name="website" defaultValue={org?.website ?? ""} maxLength={200} placeholder="www.beispiel.ch" /></label>
        <label className="field">E-Mail für Anfragen<input name="email" type="email" defaultValue={org?.email} maxLength={200} required /><span className="hint">Wird nicht angezeigt; Anfragen leiten wir dorthin weiter.</span></label>
        <label className="field">Telefon (optional, öffentlich)<input name="phone" type="tel" defaultValue={org?.phone ?? ""} maxLength={40} /></label>
      </div>
      <div className="stack" style={{ gap: 10 }}><h2 className="h3">Leistungen</h2><Checks name="services" options={ORG_SERVICES} selected={splitList(org?.services)} /></div>
      <div className="stack" style={{ gap: 10 }}><h2 className="h3">Sprachen</h2><Checks name="languages" options={SPRACHEN} selected={org ? splitList(org.languages) : ["Deutsch"]} /></div>
      <details className="stack" style={{ gap: 10 }} open={Boolean(org?.branchen)}>
        <summary className="h3" style={{ cursor: "pointer" }}>Branchen (optional)</summary>
        <p className="small muted">Leer lassen, wenn Sie für alle Branchen tätig sind.</p>
        <Checks name="branchen" options={BRANCHEN.filter((b) => b !== "Andere Branche")} selected={splitList(org?.branchen)} />
      </details>
      <label className="check"><input type="checkbox" name="confirm" required /><span className="small">Ich bin berechtigt, diese Organisation zu vertreten, und akzeptiere die <Link href="/agb" target="_blank">AGB</Link>. Inserate im Auftrag von Kunden erstelle ich nur mit deren Auftrag.</span></label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div className="wiz-nav">
        <Link className="btn btn-ghost" href={org ? "/konto?tab=partner" : "/partner"}>Abbrechen</Link>
        <button className="btn btn-red" disabled={pending}>{pending ? "Bitte warten …" : org ? "Speichern und zur Prüfung" : "Profil einreichen"}</button>
      </div>
    </form>
  );
}
