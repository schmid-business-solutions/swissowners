"use client";
import Link from "next/link";
import { useActionState } from "react";
import { login, register, requestReset, resendVerification, resetPassword, type FormState } from "@/app/auth-actions";

export function Flash({ state }: { state: FormState }) {
  if (state?.error) return <p className="flash err" role="alert">{state.error}</p>;
  if (state?.ok) return <p className="flash ok" role="status">{state.ok}</p>;
  return null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <label className="field">E-Mail<input name="email" type="email" autoComplete="email" required /></label>
      <label className="field">Passwort<input name="password" type="password" autoComplete="current-password" required /></label>
      <Flash state={state} />
      <button className="btn btn-red btn-block" disabled={pending}>{pending ? "Anmelden …" : "Anmelden"}</button>
      <p className="small"><Link href="/passwort-vergessen" className="link" style={{ minHeight: 0 }}>Passwort vergessen?</Link></p>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />
      <div className="fgrid">
        <label className="field">Vorname<input name="firstName" autoComplete="given-name" required /></label>
        <label className="field">Nachname<input name="lastName" autoComplete="family-name" required /></label>
      </div>
      <label className="field">E-Mail<input name="email" type="email" autoComplete="email" required /></label>
      <label className="field">Passwort<input name="password" type="password" autoComplete="new-password" minLength={10} required /><span className="hint">Mindestens 10 Zeichen</span></label>
      <label className="check"><input type="checkbox" name="agb" required /><span className="small">Ich akzeptiere die <Link href="/agb" target="_blank">AGB</Link> und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span></label>
      <Flash state={state} />
      <button className="btn btn-red btn-block" disabled={pending}>{pending ? "Konto wird erstellt …" : "Kostenlos registrieren"}</button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form action={action}>
      <label className="field">E-Mail<input name="email" type="email" autoComplete="email" required /></label>
      <Flash state={state} />
      <button className="btn btn-red btn-block" disabled={pending}>Link senden</button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <label className="field">Neues Passwort<input name="password" type="password" autoComplete="new-password" minLength={10} required /><span className="hint">Mindestens 10 Zeichen</span></label>
      <Flash state={state} />
      <button className="btn btn-red btn-block" disabled={pending}>Passwort speichern</button>
    </form>
  );
}

export function ResendVerification() {
  const [state, action, pending] = useActionState(resendVerification, undefined);
  return (
    <form action={action}>
      <Flash state={state} />
      <button className="btn btn-line" disabled={pending}>E-Mail erneut senden</button>
    </form>
  );
}
