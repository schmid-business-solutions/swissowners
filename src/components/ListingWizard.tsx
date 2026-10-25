"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { AKTIENKATEGORIEN, BRANCHEN, KANTONE, PHASEN, RECHTSFORMEN, UMSATZKLASSEN, subsOf } from "@/lib/taxonomy";
import { Arrow, Back, Info } from "./Icons";
import { Card } from "./ListingCards";
import type { OrgOption, PlanInfo, SubmitResult, WizardData } from "@/lib/wizard";
export type { PlanInfo, SubmitResult, WizardData } from "@/lib/wizard";

const FIELD_STEP: Record<string, number> = {
  type: 0, segment: 0,
  branche: 1, sub: 1, kanton: 1, legalForm: 1, revenueClass: 1, employees: 1, foundedYear: 1, phase: 1, companyName: 1, companyUid: 1,
  title: 2, stake: 2, amount: 2, valuation: 2, minTicket: 2, vinkuliert: 2, vorkauf: 2, shareClass: 2, description: 2, reason: 2,
};

const chfFmt = (n: number) => "CHF " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const num = (s: string) => { const v = Number(String(s).replace(/CHF|[\s'’]/gi, "")); return s.trim() && Number.isFinite(v) ? v : null; };

function HelpField({ label, help, value, onChange, options }: {
  label: string; help: React.ReactNode; value: string; onChange: (v: string) => void; options?: [string, string][];
}) {
  const [open, setOpen] = useState(false);
  const opts = options ?? [["ja", "Ja"], ["nein", "Nein"], ["unklar", "Weiss ich nicht"]];
  return (
    <div className="field">
      <span className="lbl-row">{label}
        <button type="button" className="info-btn" aria-expanded={open} aria-label={`Erklärung: ${label}`} onClick={() => setOpen(!open)}>i</button>
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {open && <div className="helpbox">{help}</div>}
    </div>
  );
}

export default function ListingWizard({
  initial, mode, plans, startLeft, startUntil, onSubmit, orgs = [],
}: {
  initial: WizardData; mode: "create" | "edit"; plans: PlanInfo[]; startLeft: number; startUntil: string; orgs?: OrgOption[];
  onSubmit: (data: WizardData) => Promise<SubmitResult>;
}) {
  const steps = mode === "create" ? ["Typ", "Firma", "Angebot", "Paket", "Prüfen und absenden"] : ["Typ", "Firma", "Angebot", "Prüfen und speichern"];
  const last = steps.length - 1;
  const [w, setW] = useState<WizardData>(() => ({ ...initial, plan: mode === "create" && startLeft <= 0 && initial.plan === "start" ? "plus" : initial.plan }));
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof WizardData>(k: K, v: WizardData[K]) => setW((p) => ({ ...p, [k]: v }));
  const sell = w.type === "sell";

  function check(s: number): string {
    if (s === 1) {
      if (!w.branche) return "Bitte eine Branche wählen.";
      if (!w.sub) return "Bitte eine Unterbranche wählen.";
      if (!w.kanton) return "Bitte den Kanton wählen.";
      if (!w.revenueClass) return "Bitte die Umsatzklasse wählen.";
      if (!/^\d{4}$/.test(w.foundedYear)) return "Bitte das Gründungsjahr angeben (z. B. 1998).";
      if (w.segment === "startup" && !w.phase) return "Bitte die Phase wählen.";
      if (w.companyName.trim().length < 2) return "Bitte den Firmennamen angeben (bleibt verborgen).";
      if (!/^CHE[-.\s]?\d{3}[.\s]?\d{3}[.\s]?\d{3}$/i.test(w.companyUid.trim())) return "Bitte die UID im Format CHE-123.456.789 angeben.";
    }
    if (s === 2) {
      if (w.title.trim().length < 10) return "Titel: mindestens 10 Zeichen.";
      if (sell && !w.stake.trim()) return "Bitte den Anteil angeben.";
      if (!sell && num(w.amount) == null) return "Bitte den gesuchten Betrag in CHF angeben.";
      if (w.amount.trim() && num(w.amount) == null) return "Betrag: bitte eine Zahl in CHF.";
      if (w.description.trim().length < 80) return `Beschreibung: mindestens 80 Zeichen (aktuell ${w.description.trim().length}).`;
      if (w.reason.trim().length < 10) return "Bitte den Grund für das Angebot angeben.";
    }
    if (s === 0 && w.orgId && !w.mandateConfirmed) return "Bitte bestätigen Sie den Auftrag Ihres Kunden.";
    if (s === last && !w.agb) return "Bitte bestätigen Sie die Angaben und die AGB.";
    return "";
  }

  function next() {
    const e = check(step);
    if (e) { setErr(e); return; }
    setErr("");
    if (step < last) { setStep(step + 1); window.scrollTo({ top: 0 }); return; }
    start(async () => {
      const r = await onSubmit(w);
      if (r?.error) {
        setErr(r.error);
        if (r.field && FIELD_STEP[r.field] != null) setStep(FIELD_STEP[r.field]);
      }
    });
  }

  const choice = (on: boolean) => ({ "aria-pressed": on, className: "choice", type: "button" as const });
  const plan = plans.find((p) => p.id === w.plan);
  const preview = {
    type: w.type, segment: w.segment, title: w.title, branche: w.branche || "Andere Branche", sub: w.sub || "–", kanton: w.kanton || "–",
    legalForm: w.legalForm, stake: w.stake, amount: num(w.amount), valuation: num(w.valuation), minTicket: num(w.minTicket),
    revenueClass: w.revenueClass || "–", phase: w.phase, vinkuliert: w.vinkuliert, vorkauf: w.vorkauf,
    companyInformed: w.type === "cap" || w.companyInformed, shareClass: w.shareClass !== "unklar" && w.segment === "startup" && sell ? w.shareClass : null,
    plan: w.plan, description: w.description,
  };

  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap">
        <div className="wizard">
          <div className="stack" style={{ gap: 16 }}>
            <h1 className="h2">{mode === "create" ? "Inserat aufgeben" : "Angebot bearbeiten"}</h1>
            <ol className="steps" aria-label="Schritte">
              {steps.map((s, i) => (
                <li key={s} data-state={i < step ? "done" : i === step ? "on" : ""} aria-current={i === step ? "step" : undefined}><span>{i < step ? "✓" : i + 1}</span>{s}</li>
              ))}
            </ol>
          </div>

          {step === 0 && (
            <>
              <div className="stack" style={{ gap: 8 }}>
                <h2 className="h3">Was möchten Sie inserieren?</h2>
                <p className="muted">{mode === "edit" ? "Der Typ kann nachträglich nicht geändert werden." : "Sie können den Typ später nicht mehr ändern."}</p>
              </div>
              <div className="choice-grid">
                <button {...choice(w.type === "sell")} disabled={mode === "edit"} onClick={() => set("type", "sell")}>
                  <span className="pill sell" style={{ alignSelf: "flex-start" }}>Anteile verkaufen</span>
                  <b>Ich verkaufe Aktien oder GmbH-Anteile</b><span className="small muted">Als Aktionär, Gesellschafter oder im Auftrag der Firma</span>
                </button>
                <button {...choice(w.type === "cap")} disabled={mode === "edit"} onClick={() => set("type", "cap")}>
                  <span className="pill cap" style={{ alignSelf: "flex-start" }}>Kapital gesucht</span>
                  <b>Meine Firma sucht Eigenkapital</b><span className="small muted">Kapitalerhöhung bei Startup oder KMU</span>
                </button>
              </div>
              <h2 className="h3">Um welche Art Firma handelt es sich?</h2>
              <div className="choice-grid">
                <button {...choice(w.segment === "startup")} onClick={() => set("segment", "startup")}>
                  <span className="pill seg-st" style={{ alignSelf: "flex-start" }}>Startup</span>
                  <b>Junge Firma im Aufbau</b><span className="small muted">Innovatives, skalierbares Geschäftsmodell, finanziert über Kapitalrunden, meist jünger als 10 Jahre</span>
                </button>
                <button {...choice(w.segment === "kmu")} onClick={() => set("segment", "kmu")}>
                  <span className="pill seg-kmu" style={{ alignSelf: "flex-start" }}>KMU</span>
                  <b>Etablierte Firma</b><span className="small muted">Bestehendes Geschäft mit regelmässigen Umsätzen, zum Beispiel Gewerbe, Industrie oder Dienstleistung</span>
                </button>
              </div>
              {orgs.length > 0 && (
                <>
                  <h2 className="h3">Für wen inserieren Sie?</h2>
                  <div className="choice-grid">
                    <button {...choice(!w.orgId)} onClick={() => setW((p) => ({ ...p, orgId: "", mandateConfirmed: false }))}>
                      <b>Für mich oder meine Firma</b><span className="small muted">Sie sind selbst Aktionär, Gesellschafter oder Organ der Firma</span>
                    </button>
                    <button {...choice(Boolean(w.orgId))} onClick={() => set("orgId", w.orgId || String(orgs[0].id))}>
                      <b>Im Auftrag eines Kunden</b><span className="small muted">Als Partner, mit Badge «Vertreten durch» und Anfragen an Sie</span>
                    </button>
                  </div>
                  {w.orgId && (
                    <div className="stack" style={{ gap: 12 }}>
                      {orgs.length > 1 && (
                        <label className="field">Partnerprofil
                          <select value={w.orgId} onChange={(e) => set("orgId", e.target.value)}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                        </label>
                      )}
                      <label className="check"><input type="checkbox" checked={w.mandateConfirmed} onChange={(e) => set("mandateConfirmed", e.target.checked)} />
                        <span>Ich bin von {sell ? "den verkaufenden Aktionären bzw. Gesellschaftern" : "der Firma"} beauftragt, dieses Inserat zu erstellen, und kann den Auftrag auf Verlangen belegen. <span className="small muted" style={{ display: "block" }}>Das Inserat erscheint mit «Vertreten durch {orgs.find((o) => String(o.id) === w.orgId)?.name}». Anfragen gehen an Sie.</span></span></label>
                    </div>
                  )}
                </>
              )}
              {!sell && (
                <div className="notice neutral small"><Info /><span>Kapitalgesuche dürfen nur von der Firma selbst (Verwaltungsrat oder Geschäftsführung) oder in ihrem Auftrag aufgegeben werden. Für öffentliche Angebote von Effekten können Prospektpflichten bestehen – dafür sind Sie als Inserent verantwortlich.</span></div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div className="stack" style={{ gap: 8 }}>
                <h2 className="h3">Angaben zur Firma</h2>
                <p className="muted">Branche, Kanton und Kennzahlen sind öffentlich. Firmenname und UID bleiben verborgen, bis ein Interessent die Vertraulichkeitserklärung unterzeichnet. Wir prüfen sie vor der Freischaltung im Handelsregister.</p>
              </div>
              <div className="fgrid">
                <label className="field">Firmenname (verborgen)<input value={w.companyName} onChange={(e) => set("companyName", e.target.value)} maxLength={200} autoComplete="organization" /></label>
                <label className="field">UID (verborgen)<input value={w.companyUid} onChange={(e) => set("companyUid", e.target.value)} placeholder="CHE-123.456.789" /><span className="hint">Zu finden auf <a href="https://www.zefix.ch" target="_blank" rel="noopener noreferrer">zefix.ch</a></span></label>
                <label className="field">Branche
                  <select value={w.branche} onChange={(e) => setW((p) => ({ ...p, branche: e.target.value, sub: "" }))}>
                    <option value="">Bitte wählen</option>{BRANCHEN.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </label>
                <label className="field">Unterbranche
                  <select value={w.sub} onChange={(e) => set("sub", e.target.value)} disabled={!w.branche}>
                    <option value="">Bitte wählen</option>{w.branche && subsOf(w.branche).map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <span className="hint">Nicht dabei? Wählen Sie «Andere» und beschreiben Sie die Tätigkeit im Angebot.</span>
                </label>
                <label className="field">Kanton (Sitz)
                  <select value={w.kanton} onChange={(e) => set("kanton", e.target.value)}>
                    <option value="">Bitte wählen</option>{KANTONE.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </label>
                <label className="field">Rechtsform
                  <select value={w.legalForm} onChange={(e) => set("legalForm", e.target.value)}>{RECHTSFORMEN.map((r) => <option key={r}>{r}</option>)}</select>
                </label>
                <label className="field">Umsatzklasse
                  <select value={w.revenueClass} onChange={(e) => set("revenueClass", e.target.value)}>
                    <option value="">Bitte wählen</option>{UMSATZKLASSEN.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </label>
                <label className="field">Mitarbeitende<input inputMode="numeric" value={w.employees} onChange={(e) => set("employees", e.target.value.replace(/\D/g, ""))} /></label>
                <label className="field">Gründungsjahr<input inputMode="numeric" maxLength={4} value={w.foundedYear} onChange={(e) => set("foundedYear", e.target.value.replace(/\D/g, ""))} /></label>
                {w.segment === "startup" && (
                  <label className="field">Phase
                    <select value={w.phase} onChange={(e) => set("phase", e.target.value)}>
                      <option value="">Bitte wählen</option>{PHASEN.map((p) => <option key={p}>{p}</option>)}
                    </select>
                    <span className="hint">Letzte abgeschlossene Finanzierungsrunde</span>
                  </label>
                )}
              </div>
              {w.segment === "startup" && /^\d{4}$/.test(w.foundedYear) && Number(w.foundedYear) <= new Date().getFullYear() - 10 && (
                <div className="notice small" role="status"><Info /><span>Ihre Firma ist über 10 Jahre alt. Wenn sie regelmässige Umsätze erzielt, passt «KMU» meist besser. <button type="button" className="link" style={{ minHeight: 0 }} onClick={() => set("segment", "kmu")}>Zu KMU wechseln</button></span></div>
              )}
              {sell && (
                <label className="check"><input type="checkbox" checked={w.companyInformed} onChange={(e) => set("companyInformed", e.target.checked)} />
                  <span>Die Firma (Verwaltungsrat oder Geschäftsführung) ist über das Angebot informiert <span className="small muted" style={{ display: "block" }}>Ergibt das Badge «Firma informiert» und schafft Vertrauen bei Käufern.</span></span></label>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="stack" style={{ gap: 8 }}>
                <h2 className="h3">{sell ? "Ihr Angebot" : "Ihr Kapitalgesuch"}</h2>
                <p className="muted">Klare Angaben bringen mehr ernsthafte Anfragen. Nennen Sie den Firmennamen nicht im Text.</p>
              </div>
              <div className="fgrid">
                <label className="field" style={{ gridColumn: "1/-1" }}>Titel des Angebots<input value={w.title} onChange={(e) => set("title", e.target.value)} maxLength={80} placeholder={sell ? "z. B. Treuhandbüro, Teilverkauf 25 %" : "z. B. Solarinstallateur, Kapital für zwei neue Teams"} /><span className="hint">Ohne Firmenname, max. 80 Zeichen ({w.title.length}/80)</span></label>
                {sell ? (
                  <>
                    <label className="field">Anteil in % oder Anzahl Aktien<input value={w.stake} onChange={(e) => set("stake", e.target.value)} maxLength={60} placeholder="z. B. 25 % oder 120 Namenaktien" /></label>
                    <label className="field">Preisvorstellung (CHF)<input inputMode="numeric" value={w.amount} onChange={(e) => set("amount", e.target.value)} placeholder="z. B. 180000" /><span className="hint">Leer lassen für «auf Anfrage»</span></label>
                  </>
                ) : (
                  <>
                    <label className="field">Gesuchter Betrag (CHF)<input inputMode="numeric" value={w.amount} onChange={(e) => set("amount", e.target.value)} placeholder="z. B. 500000" /></label>
                    <label className="field">Pre-Money-Bewertung (CHF)<input inputMode="numeric" value={w.valuation} onChange={(e) => set("valuation", e.target.value)} /><span className="hint">Optional, leer für «auf Anfrage»</span></label>
                    <label className="field">Mindestbetrag pro Investor (CHF)<input inputMode="numeric" value={w.minTicket} onChange={(e) => set("minTicket", e.target.value)} /><span className="hint">Optional</span></label>
                  </>
                )}
                <HelpField label="Sind die Anteile vinkuliert?" value={w.vinkuliert} onChange={(v) => set("vinkuliert", v as WizardData["vinkuliert"])}
                  help={<><b>Vinkuliert</b> heisst: Die Anteile dürfen nur mit Zustimmung der Firma übertragen werden. Bei Namenaktien entscheidet meist der Verwaltungsrat. Er kann einen Käufer aus wichtigen Gründen ablehnen, die in den Statuten stehen, oder anbieten, die Aktien zum wirklichen Wert selbst zu übernehmen. Ob Ihre Aktien vinkuliert sind, steht in den Statuten. Bei GmbH-Anteilen muss grundsätzlich die Gesellschafterversammlung zustimmen.</>} />
                <HelpField label="Bestehen Vorkaufsrechte?" value={w.vorkauf} onChange={(v) => set("vorkauf", v as WizardData["vorkauf"])}
                  help={<>Ein <b>Vorkaufsrecht</b> gibt anderen Aktionären oder Gesellschaftern das Recht, Ihre Anteile vor einem neuen Käufer zu kaufen, meist zum gleichen Preis. Es steht oft in einem Aktionärbindungsvertrag, bei der GmbH auch in den Statuten. Sie müssen die Berechtigten informieren, bevor Sie an jemand anderen verkaufen.</>} />
                {sell && w.segment === "startup" && (
                  <HelpField label="Welche Aktien verkaufen Sie?" value={w.shareClass} onChange={(v) => set("shareClass", v)} options={AKTIENKATEGORIEN}
                    help={<>Startups haben oft zwei Kategorien: <b>Stammaktien</b> halten meist Gründer und Mitarbeitende. <b>Vorzugsaktien</b> erhalten Investoren in Finanzierungsrunden; sie haben Vorrechte, etwa beim Verkauf der ganzen Firma (Liquidationspräferenz). Mitarbeiteraktien können Sperrfristen oder Rückkaufsrechte haben.</>} />
                )}
                <label className="field" style={{ gridColumn: "1/-1" }}>Beschreibung<textarea value={w.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} style={{ minHeight: 160 }} /><span className="hint">Tätigkeit, Marktstellung, Kennzahlen, was Käufer erwartet – mindestens 80 Zeichen ({w.description.trim().length})</span></label>
                <label className="field" style={{ gridColumn: "1/-1" }}>Grund für das Angebot<textarea value={w.reason} onChange={(e) => set("reason", e.target.value)} maxLength={1000} placeholder={sell ? "z. B. Nachfolgeregelung, Erbteilung, Diversifikation" : "z. B. Ausbau Vertrieb, neue Produktionsanlage"} /></label>
              </div>
              {(w.vinkuliert === "unklar" || w.vorkauf === "unklar") && (
                <div className="notice small"><Info /><span>Bitte klären Sie Vinkulierung und Vorkaufsrechte in den Statuten oder im Aktionärbindungsvertrag. Ohne diese Angaben scheitern viele Verkäufe.</span></div>
              )}
            </>
          )}

          {mode === "create" && step === 3 && (
            <>
              <div className="stack" style={{ gap: 8 }}><h2 className="h3">Paket wählen</h2><p className="muted">Fixe Gebühr, keine Provision auf den Verkaufspreis.</p></div>
              {startLeft > 0 && (
                <>
                  <button {...choice(w.plan === "start")} className="choice start-choice" onClick={() => set("plan", "start")}>
                    <span className="row" style={{ gap: 8, justifyContent: "space-between", width: "100%" }}>
                      <b style={{ fontSize: 18 }}>Startangebot: 60 Tage kostenlos</b><span className="chip red">Noch {startLeft} Plätze</span>
                    </span>
                    <span>Alle Leistungen von <b>Plus</b>. Kein Zahlungsmittel nötig.</span>
                    <span className="small muted">Gilt längstens bis {startUntil}. 7 Tage vor Ablauf erinnern wir Sie: Sie wählen ein Paket oder das Angebot endet automatisch – ohne Kosten.</span>
                  </button>
                  <p className="small muted" style={{ marginTop: -8 }}>Oder direkt ein Paket wählen:</p>
                </>
              )}
              <div className="choice-grid">
                {plans.map((p) => (
                  <button key={p.id} {...choice(w.plan === p.id)} onClick={() => set("plan", p.id)}>
                    <b>{p.name}{p.id === "plus" && <span className="chip red" style={{ marginLeft: 6 }}>Beliebt</span>}</b>
                    <span className="price">{chfFmt(p.first)}</span>
                    <span className="small" style={{ fontWeight: 600 }}>für die ersten 60 Tage</span>
                    <span className="small muted">danach {chfFmt(p.renewal)} pro 30 Tage</span>
                    <span className="small muted">{p.text}</span>
                  </button>
                ))}
              </div>
              <div className="notice neutral small"><Info /><span>Die Laufzeit beginnt mit der Freischaltung. Nach 60 Tagen verlängert sich ein Paket automatisch um jeweils 30 Tage; wir erinnern Sie 5 Tage vorher. <b>Kündigen oder pausieren</b> Sie jederzeit in «Mein Bereich».</span></div>
            </>
          )}

          {step === last && (
            <div className="detail" style={{ gap: 24 }}>
              <div className="detail-main" style={{ gap: 14 }}>
                <span className="fact-l">Vorschau</span>
                <Card l={preview} />
              </div>
              <div className="detail-side" style={{ position: "static", gap: 14 }}>
                <span className="fact-l">Zusammenfassung</span>
                {mode === "edit" ? (
                  <p className="small">Nach dem Speichern prüfen wir die Änderungen. Bis zur erneuten Freischaltung ist das Angebot nicht öffentlich sichtbar.</p>
                ) : w.plan === "start" || !plan ? (
                  <div className="summary"><span>Startangebot, 60 Tage</span><span>CHF 0</span><span className="total">Total</span><span className="total">CHF 0</span></div>
                ) : (
                  <>
                    <div className="summary">
                      <span>Paket {plan.name}, erste 60 Tage</span><span>{chfFmt(plan.first)}</span>
                      <span className="total">Total heute</span><span className="total">{chfFmt(plan.first)}</span>
                    </div>
                    <p className="small muted">Danach {chfFmt(plan.renewal)} alle 30 Tage, bis Sie kündigen oder pausieren. Bezahlung über Payrexx (TWINT, Karte, PostFinance u. a.).</p>
                  </>
                )}
                <label className="check"><input type="checkbox" checked={w.agb} onChange={(e) => set("agb", e.target.checked)} />
                  <span className="small">Ich bestätige die Richtigkeit der Angaben, die <Link href="/agb" target="_blank">AGB</Link>{mode === "create" && w.plan !== "start" ? " inklusive automatischer Verlängerung um jeweils 30 Tage" : ""} und dass ich für Prospektpflichten, Vinkulierung und Vorkaufsrechte selbst verantwortlich bin.</span></label>
              </div>
            </div>
          )}

          {err && <p className="err" role="alert">{err}</p>}

          <div className="wiz-nav">
            {step > 0 ? <button className="btn btn-line" onClick={() => { setErr(""); setStep(step - 1); }}><Back />Zurück</button>
              : <Link className="btn btn-ghost" href={mode === "edit" ? "/konto" : "/"}>Abbrechen</Link>}
            <button className="btn btn-red" onClick={next} disabled={pending}>
              {pending ? "Bitte warten …" : step < last ? "Weiter" : mode === "edit" ? "Speichern und zur Prüfung" : w.plan === "start" ? "Kostenlos einreichen" : "Weiter zur Zahlung"}<Arrow />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
