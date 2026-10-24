"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Check, Close, Heart } from "@/components/Icons";
import { sendRequest, toggleSave } from "./actions";

type Props = {
  listingId: number; no: string; mode: "anon" | "unverified" | "owner" | "sent" | "ready" | "sample";
  userName: string; userPhone: string; saved: boolean;
};

export default function Contact({ listingId, no, mode, userName, userPhone, saved: initialSaved }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1>(0);
  const [nda, setNda] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [pendingSave, startSave] = useTransition();
  const [state, action, pending] = useActionState(sendRequest.bind(null, listingId), undefined);

  useEffect(() => {
    if (state?.ok) { setOpen(false); router.refresh(); }
  }, [state, router]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const save = () => startSave(async () => {
    const r = await toggleSave(listingId);
    if ("login" in r) router.push(`/login?next=/inserate/${no}`);
    else setSaved(r.saved);
  });

  const loginHref = `/login?next=${encodeURIComponent(`/inserate/${no}`)}`;

  return (
    <>
      {mode === "sample" ? (
        <>
          <span className="btn btn-line btn-block" aria-disabled="true" style={{ cursor: "default", opacity: 0.6 }}>Musterangebot – keine Anfrage möglich</span>
          <Link className="btn btn-red btn-block" href="/inserat-aufgeben">Eigenes Angebot erfassen</Link>
        </>
      ) : mode === "sent" ? (
        <>
          <div className="notice" style={{ background: "var(--ok-soft)" }}><Check size={22} /><span><b>Anfrage gesendet.</b><br /><span className="small">Der Inserent antwortet Ihnen direkt per E-Mail.</span></span></div>
          <Link className="btn btn-line btn-block" href="/konto?tab=anfragen">Zu meinen Anfragen</Link>
        </>
      ) : mode === "owner" ? (
        <Link className="btn btn-line btn-block" href="/konto">Ihr Angebot verwalten</Link>
      ) : mode === "anon" ? (
        <Link className="btn btn-red btn-block" href={loginHref}>Details anfragen</Link>
      ) : mode === "unverified" ? (
        <Link className="btn btn-red btn-block" href={`/bestaetigen?next=/inserate/${no}`}>E-Mail bestätigen und anfragen</Link>
      ) : (
        <button className="btn btn-red btn-block" onClick={() => { setOpen(true); setStep(0); }}>Details anfragen</button>
      )}
      {mode !== "owner" && mode !== "sample" && (
        <button className="btn btn-ghost btn-block" onClick={save} disabled={pendingSave} aria-pressed={saved}>
          <Heart />{saved ? "Gemerkt" : "Angebot merken"}
        </button>
      )}

      {open && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="mTitle" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h2 className="h3" id="mTitle">{step === 0 ? "Vertraulichkeitserklärung" : "Nachricht an den Inserenten"}</h2>
              <button className="icon-btn" aria-label="Schliessen" onClick={() => setOpen(false)}><Close /></button>
            </div>
            {step === 0 ? (
              <>
                <div className="nda" tabIndex={0} aria-label="Text der Vertraulichkeitserklärung">
                  <b>Vertraulichkeitserklärung zu Angebot {no}</b>
                  <p>1. Ich verpflichte mich, alle Informationen zu diesem Angebot, insbesondere den Namen der Firma und erhaltene Unterlagen, vertraulich zu behandeln und ausschliesslich zur Prüfung eines Erwerbs oder einer Beteiligung zu verwenden.</p>
                  <p>2. Ich gebe keine Informationen an Dritte weiter, ausgenommen an meine Berater, die ebenfalls zur Verschwiegenheit verpflichtet sind.</p>
                  <p>3. Ich nehme mit der Firma, ihren Mitarbeitenden, Kunden oder Lieferanten keinen direkten Kontakt auf, ohne vorgängige Zustimmung des Inserenten.</p>
                  <p>4. Die Pflicht gilt zwei Jahre ab heute. Es gilt Schweizer Recht. Die Erklärung gilt gegenüber dem Inserenten; SwissOwners ist nicht Vertragspartei.</p>
                </div>
                <label className="check"><input type="checkbox" checked={nda} onChange={(e) => setNda(e.target.checked)} /><span>Ich habe die Vertraulichkeitserklärung gelesen und unterzeichne sie digital als <b>{userName}</b>.</span></label>
                <button className="btn btn-red btn-block" disabled={!nda} onClick={() => setStep(1)}>Weiter</button>
              </>
            ) : (
              <form action={action} className="stack" style={{ gap: 14 }}>
                <input type="hidden" name="nda" value="on" />
                <label className="field">Ihre Nachricht
                  <textarea name="message" required minLength={20} maxLength={3000} placeholder="Stellen Sie sich kurz vor und schreiben Sie, was Sie interessiert." />
                </label>
                <label className="field">Telefon (optional)<input name="phone" type="tel" defaultValue={userPhone} autoComplete="tel" /></label>
                <label className="check"><input type="checkbox" name="share" required /><span className="small">Mein Name, meine E-Mail-Adresse und gegebenenfalls Telefonnummer werden mit der Nachricht an den Inserenten weitergegeben.</span></label>
                {state?.error && <p className="err" role="alert">{state.error}</p>}
                <div className="row" style={{ gap: 10, justifyContent: "space-between" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Zurück</button>
                  <button className="btn btn-red" disabled={pending}>{pending ? "Wird gesendet …" : "Anfrage senden"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
