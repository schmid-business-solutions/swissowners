import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
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

/* Offizielle Logos der Anbieter (aus deren Branding-Paketen) werden angezeigt, sobald sie unter
   public/brand/google.svg bzw. public/brand/linkedin.svg (oder .png) liegen. */
function brandLogo(p: string): string | null {
  for (const ext of ["svg", "png"]) {
    if (fs.existsSync(path.join(process.cwd(), "public", "brand", `${p}.${ext}`))) return `/brand/${p}.${ext}`;
  }
  return null;
}

/** Buttons «Mit Google / LinkedIn anmelden» im Erscheinungsbild der Anbieter – nur sichtbar, wenn konfiguriert */
export default function SocialLogin({ next, mode }: { next: string; mode: "login" | "register" }) {
  const providers = enabledProviders();
  if (!providers.length) return null;
  return (
    <div className="stack" style={{ gap: 12 }}>
      {providers.map((p) => {
        const logo = brandLogo(p);
        return (
          <Link key={p} className={`sso-btn sso-${p}`} href={`/api/auth/${p}?next=${encodeURIComponent(next)}`} prefetch={false}>
            {logo && <span className="sso-logo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={logo} alt="" width={20} height={20} /></span>}
            <span className="sso-label">Mit {providerLabel(p)} {mode === "register" ? "registrieren" : "anmelden"}</span>
          </Link>
        );
      })}
      {mode === "register" && (
        <p className="small muted">Mit der Registrierung über {providers.map(providerLabel).join(" oder ")} akzeptieren Sie die <Link href="/agb">AGB</Link> und die <Link href="/datenschutz">Datenschutzerklärung</Link>. Wir erhalten nur Ihren Namen und Ihre E-Mail-Adresse.</p>
      )}
      <div className="or-sep" role="separator"><span>oder mit E-Mail</span></div>
    </div>
  );
}
