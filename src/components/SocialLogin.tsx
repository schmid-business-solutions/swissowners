import Link from "next/link";
import { enabledProviders, providerLabel } from "@/lib/oauth";

const ERR: Record<string, string> = {
  "oauth-abbruch": "Die Anmeldung wurde abgebrochen.",
  "oauth-sitzung": "Die Anmeldung ist abgelaufen. Bitte versuchen Sie es erneut.",
  "oauth-email": "Ihr Konto beim Anbieter hat keine bestätigte E-Mail-Adresse. Bitte registrieren Sie sich mit E-Mail und Passwort.",
  "oauth-fehler": "Die Anmeldung beim Anbieter hat nicht geklappt. Bitte versuchen Sie es erneut.",
  "oauth-inaktiv": "Diese Anmeldeart ist noch nicht verfügbar.",
  "oauth-limit": "Zu viele Versuche. Bitte warten Sie einige Minuten.",
};

export function OAuthError({ code }: { code?: string }) {
  if (!code || !ERR[code]) return null;
  return <p className="flash err" role="alert">{ERR[code]}</p>;
}

/** Buttons «Mit Google / LinkedIn fortfahren» – erscheinen nur, wenn der Anbieter konfiguriert ist */
export default function SocialLogin({ next, mode }: { next: string; mode: "login" | "register" }) {
  const providers = enabledProviders();
  if (!providers.length) return null;
  return (
    <div className="stack" style={{ gap: 12 }}>
      {providers.map((p) => (
        <Link key={p} className={`btn btn-social btn-block social-${p}`} href={`/api/auth/${p}?next=${encodeURIComponent(next)}`} prefetch={false}>
          Mit {providerLabel(p)} {mode === "register" ? "registrieren" : "anmelden"}
        </Link>
      ))}
      {mode === "register" && (
        <p className="small muted">Mit der Registrierung über {providers.map(providerLabel).join(" oder ")} akzeptieren Sie die <Link href="/agb">AGB</Link> und die <Link href="/datenschutz">Datenschutzerklärung</Link>. Wir erhalten nur Ihren Namen und Ihre E-Mail-Adresse.</p>
      )}
      <div className="or-sep" role="separator"><span>oder mit E-Mail</span></div>
    </div>
  );
}
