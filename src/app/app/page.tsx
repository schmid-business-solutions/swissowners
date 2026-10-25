import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm, RegisterForm } from "@/components/AuthForms";
import SocialLogin, { OAuthError } from "@/components/SocialLogin";
import { Cross } from "@/components/Icons";
import AppIntro from "./AppIntro";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Willkommen", robots: { index: false } };

const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/app") ? n : "/");

/** Einstieg der Android-App: Intro beim ersten Start, danach Anmeldung bzw. Registrierung */
export default async function AppEntry({ searchParams }: { searchParams: Promise<{ next?: string; step?: string; err?: string }> }) {
  const { next: rawNext, step, err } = await searchParams;
  const next = safe(rawNext);
  if (await getUser().catch(() => null)) redirect(next);

  const introSeen = (await cookies()).get("swo_intro")?.value === "1";
  const q = rawNext ? `&next=${encodeURIComponent(next)}` : "";
  const mode = step === "registrieren" ? "register" : step === "login" || introSeen || err ? "login" : "intro";

  if (mode === "intro") return <div className="app-screen"><AppIntro loginHref={`/app?step=login${q}`} registerHref={`/app?step=registrieren${q}`} /></div>;

  return (
    <div className="app-screen">
      <div className="app-auth">
        <div className="app-brand">
          <span className="app-mark"><Cross size={30} /></span>
          <span className="logo-text">Swiss<i>Owners</i></span>
        </div>
        {mode === "login" ? (
          <>
            <div>
              <h1 className="app-title">Anmelden</h1>
              <p className="muted">Melden Sie sich an, um Angebote zu entdecken, zu merken und Kontakt aufzunehmen.</p>
            </div>
            <OAuthError code={err} />
            <SocialLogin next={next} mode="login" />
            <LoginForm next={next} />
            <p className="muted app-switch">Noch kein Konto? <Link className="link" href={`/app?step=registrieren${q}`}>Kostenlos registrieren</Link></p>
          </>
        ) : (
          <>
            <div>
              <h1 className="app-title">Konto erstellen</h1>
              <p className="muted">Kostenlos und in einer Minute erledigt.</p>
            </div>
            <SocialLogin next={next} mode="register" />
            <RegisterForm next={next} />
            <p className="muted app-switch">Schon registriert? <Link className="link" href={`/app?step=login${q}`}>Anmelden</Link></p>
          </>
        )}
        <p className="small muted app-legal"><Link href="/agb">AGB</Link> · <Link href="/datenschutz">Datenschutz</Link> · <Link href="/impressum">Impressum</Link></p>
      </div>
    </div>
  );
}
