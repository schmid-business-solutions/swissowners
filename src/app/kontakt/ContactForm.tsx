"use client";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "@/components/Icons";
import { CONTACT_GROUPS, CONTACT_TOPICS, MAX_TOPICS, mergeTopics, parseTopics, type ExtraField } from "@/lib/contact";
import { sendContact } from "./actions";

const ICON: Record<string, React.ReactNode> = {
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01" /></>,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  bug: <><rect x="7" y="8" width="10" height="12" rx="5" /><path d="M12 8v12M9 5l1.5 2M15 5l-1.5 2M3 13h4M17 13h4M4 19l3-2M20 19l-3-2M4 7l3 2M20 7l-3 2" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>,
  chat: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  dots: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
  megaphone: <><path d="M3 10v4h4l8 5V5L7 10z" /><path d="M18 9a4 4 0 0 1 0 6M7 14l1.5 6h3L10 15" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  handshake: <><path d="M3 11l4-4 5 2 5-2 4 4-4 4" /><path d="M7 7v6l4 4c.8.8 2 .8 2.8 0l3.2-3.2M10 13l2 2M12 11l3 3" /></>,
  news: <><rect x="3" y="5" width="15" height="15" rx="1" /><path d="M18 9h3v9a2 2 0 0 1-4 0M7 9h7M7 13h7M7 16h4" /></>,
};

function TopicIcon({ name }: { name: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON[name] ?? ICON.dots}
    </svg>
  );
}

function Rating({ field }: { field: ExtraField }) {
  const [v, setV] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || v;
  return (
    <div className="field">
      <span>{field.label}</span>
      <input type="hidden" name={`x_${field.name}`} value={v || ""} />
      <div className="stars" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={field.label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={v === n} aria-label={`${n} von 5`}
            className={n <= shown ? "on" : ""} onMouseEnter={() => setHover(n)} onClick={() => setV(n === v ? 0 : n)}>
            <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
          </button>
        ))}
        <span className="small muted">{shown ? ["", "Schlecht", "Mässig", "Gut", "Sehr gut", "Ausgezeichnet"][shown] : "Optional"}</span>
      </div>
    </div>
  );
}

function Extra({ f }: { f: ExtraField }) {
  if (f.type === "rating") return <Rating field={f} />;
  const label = <span>{f.label}{!f.required && <span className="opt"> (optional)</span>}</span>;
  if (f.type === "select") {
    return (
      <label className="field">{label}
        <select name={`x_${f.name}`} required={f.required} defaultValue="">
          <option value="" disabled={f.required}>Bitte wählen</option>
          {f.options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="field">{label}
      <input name={`x_${f.name}`} required={f.required} placeholder={f.placeholder} maxLength={300} />
      {f.hint && <span className="hint">{f.hint}</span>}
    </label>
  );
}

export default function ContactForm({ initialTopic, defaults }: { initialTopic?: string; defaults: { name: string; email: string; phone: string } }) {
  const [ids, setIds] = useState<string[]>(() => parseTopics(initialTopic).map((t) => t.id));
  const [limitHit, setLimitHit] = useState(false);
  const chosen = useMemo(() => parseTopics(ids), [ids]);
  const m = useMemo(() => mergeTopics(chosen), [chosen]);
  const [state, action, pending] = useActionState(sendContact, undefined);
  const [started] = useState(() => Date.now());
  const formRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const toggle = (id: string) => {
    const on = ids.includes(id);
    if (!on && ids.length >= MAX_TOPICS) { setLimitHit(true); return; }
    setLimitHit(false);
    const next = on ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next);
    const url = new URL(window.location.href);
    if (next.length) url.searchParams.set("thema", next.join(",")); else url.searchParams.delete("thema");
    window.history.replaceState(null, "", url);
  };
  useEffect(() => { if (state?.ok) doneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [state]);

  if (state?.ok) {
    return (
      <div ref={doneRef} className="contact-done">
        <span className="contact-done-ic"><Check size={30} /></span>
        <h2 className="h3">Danke, Ihre Nachricht ist angekommen.</h2>
        <p className="muted">Ein Mensch aus unserem Team liest sie und antwortet Ihnen in der Regel innerhalb von 1 bis 2 Werktagen{state.email ? <> an <b>{state.email}</b></> : null}.</p>
        {state.no && <p className="small muted">Ihre Referenz: <b>{state.no}</b> – eine Bestätigung ist per E-Mail unterwegs.</p>}
        <div className="row" style={{ gap: 10, justifyContent: "center" }}>
          <Link className="btn btn-red" href="/">Zur Startseite</Link>
          <a className="btn btn-line" href="/kontakt">Weitere Nachricht</a>
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 28 }}>
      <div className="stack" style={{ gap: 22 }}>
        <div className="stack" style={{ gap: 4 }}>
          <h2 className="h3 contact-step"><span>1</span>Worum geht es?</h2>
          <p className="small muted contact-sub">Wählen Sie 1 bis {MAX_TOPICS} Themen.</p>
        </div>
        {CONTACT_GROUPS.map((g) => (
          <div key={g.id} className="stack" style={{ gap: 10 }}>
            <p className="contact-group">{g.label}</p>
            <div className="topic-grid">
              {CONTACT_TOPICS.filter((t) => t.group === g.id).map((t) => (
                <button key={t.id} type="button" className="topic" aria-pressed={ids.includes(t.id)} onClick={() => toggle(t.id)} data-full={ids.length >= MAX_TOPICS ? "1" : undefined}>
                  <span className="topic-ic"><TopicIcon name={t.icon} /></span>
                  <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                    <b>{t.label}</b>
                    <span className="small muted">{t.text}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className={`topic-status${ids.length ? " on" : ""}`} aria-live="polite">
          {ids.length === 0 ? <span className="small muted">Noch kein Thema gewählt.</span> : (
            <>
              <span className="small"><b>{ids.length} von {MAX_TOPICS}</b> gewählt{limitHit || ids.length >= MAX_TOPICS ? " – maximal erreicht. Zum Wechseln ein Thema abwählen." : ""}</span>
              <button type="button" className="btn btn-red topic-next" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>Weiter zum Formular</button>
            </>
          )}
        </div>
      </div>

      <div ref={formRef} style={{ scrollMarginTop: 120 }}>
        {chosen.length === 0 ? (
          <div className="notice neutral contact-hint"><span className="small">Wählen Sie oben 1 bis {MAX_TOPICS} Themen – danach erscheint das passende Formular.</span></div>
        ) : (
          <form action={action} className="contact-form stack">
            <div className="stack" style={{ gap: 8 }}>
              <h2 className="h3 contact-step"><span>2</span>Ihre Nachricht</h2>
              <div className="topic-tags">
                {chosen.map((t) => (
                  <button key={t.id} type="button" className="topic-tag" onClick={() => toggle(t.id)} aria-label={`${t.label} entfernen`}>
                    {t.label}<span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            </div>
            {chosen.map((t) => <input key={t.id} type="hidden" name="topic" value={t.id} />)}
            <input type="hidden" name="t" value={started} />
            <div className="hp" aria-hidden="true"><label>Fax<input name="fax" tabIndex={-1} autoComplete="off" /></label></div>

            {m.notes.map((n) => (
              <div key={n.href} className="notice neutral"><span className="small">{n.text} <Link href={n.href}>{n.link}</Link></span></div>
            ))}

            <div className="form-grid">
              <label className="field">Name<input name="name" required minLength={2} maxLength={160} autoComplete="name" defaultValue={defaults.name} /></label>
              <label className="field">E-Mail<input name="email" type="email" required maxLength={255} autoComplete="email" defaultValue={defaults.email} /></label>
              <label className="field"><span>Telefon<span className="opt"> (optional)</span></span><input name="phone" type="tel" maxLength={40} autoComplete="tel" defaultValue={defaults.phone} /></label>
              <label className="field"><span>{m.press ? "Firma oder Medium" : "Firma"}{!m.companyRequired && <span className="opt"> (optional)</span>}</span>
                <input name="company" required={m.companyRequired} maxLength={160} autoComplete="organization" />
              </label>
              {m.extra.map((f) => <div key={f.name} className={f.type === "rating" ? "span-2" : ""}><Extra f={f} /></div>)}
            </div>

            <label className="field"><span>Betreff<span className="opt"> (optional)</span></span><input name="subject" maxLength={200} placeholder={m.label} /></label>
            <label className="field">Nachricht
              <textarea name="message" required minLength={20} maxLength={5000} rows={7} placeholder={m.placeholder} />
            </label>

            <label className="check"><input type="checkbox" name="privacy" required />
              <span className="small">Ich bin einverstanden, dass SwissOwners meine Angaben zur Bearbeitung dieser Anfrage verwendet. Mehr in der <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link>.</span>
            </label>

            {state?.error && <p className="flash err" role="alert">{state.error}</p>}
            <div className="row contact-submit">
              <button className="btn btn-red" disabled={pending}>{pending ? "Wird gesendet …" : "Nachricht senden"}</button>
              <span className="small muted">Antwort in der Regel innerhalb von 1 bis 2 Werktagen.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
