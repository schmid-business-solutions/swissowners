"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Check, Close } from "./Icons";
import { sendInquiry } from "@/app/inquiry-actions";

type Mode = "anon" | "unverified" | "own" | "sent" | "ready" | "sample";

/** Kontakt-Button mit Formular im Dialog – für VR-Mandate, VR-Profile und Partner */
export default function InquiryBox({ kind, targetId, path, mode, label, title, placeholder, sampleText, ownHref, ownLabel }: {
  kind: "mandate" | "profile" | "org"; targetId: number; path: string; mode: Mode;
  label: string; title: string; placeholder: string; sampleText: string; ownHref: string; ownLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendInquiry.bind(null, kind, targetId, path), undefined);
  useEffect(() => { if (state?.ok) { setOpen(false); router.refresh(); } }, [state, router]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (mode === "sample") return <span className="btn btn-line btn-block" aria-disabled="true" style={{ cursor: "default", opacity: 0.6 }}>{sampleText}</span>;
  if (mode === "own") return <Link className="btn btn-line btn-block" href={ownHref}>{ownLabel}</Link>;
  if (mode === "sent") return <div className="notice" style={{ background: "var(--ok-soft)" }}><Check size={22} /><span><b>Anfrage gesendet.</b><br /><span className="small">Die Antwort kommt direkt per E-Mail.</span></span></div>;
  if (mode === "anon") return <Link className="btn btn-red btn-block" href={`/login?next=${encodeURIComponent(path)}`}>{label}</Link>;
  if (mode === "unverified") return <Link className="btn btn-red btn-block" href={`/bestaetigen?next=${encodeURIComponent(path)}`}>E-Mail bestätigen und {label.toLowerCase()}</Link>;

  return (
    <>
      <button className="btn btn-red btn-block" onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="iqTitle" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <h2 className="h3" id="iqTitle">{title}</h2>
              <button className="icon-btn" aria-label="Schliessen" onClick={() => setOpen(false)}><Close /></button>
            </div>
            <form action={action} className="stack" style={{ gap: 14 }}>
              <label className="field">Ihre Nachricht
                <textarea name="message" required minLength={20} maxLength={3000} placeholder={placeholder} />
              </label>
              {kind === "mandate" && (
                <label className="check"><input type="checkbox" name="nda" required /><span className="small">Ich behandle den Namen der Firma und alle erhaltenen Informationen vertraulich und verwende sie nur zur Prüfung dieses Mandats.</span></label>
              )}
              <label className="check"><input type="checkbox" name="share" required /><span className="small">Mein Name, meine E-Mail-Adresse und gegebenenfalls Telefonnummer werden mit der Nachricht weitergegeben.</span></label>
              {state?.error && <p className="err" role="alert">{state.error}</p>}
              <div className="row" style={{ gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Abbrechen</button>
                <button className="btn btn-red" disabled={pending}>{pending ? "Wird gesendet …" : "Anfrage senden"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
