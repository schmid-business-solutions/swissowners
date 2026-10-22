import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import SocialLogin, { OAuthError } from "@/components/SocialLogin";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; err?: string }> }) {
  const { next = "/konto", err } = await searchParams;
  if (await getUser()) redirect(next.startsWith("/") ? next : "/konto");
  return (
    <section>
      <div className="wrap">
        <div className="auth">
          <h1 className="h2">Anmelden</h1>
          <OAuthError code={err} />
          <SocialLogin next={next} mode="login" />
          <LoginForm next={next} />
          <p className="muted">Noch kein Konto? <Link className="link" href={`/registrieren?next=${encodeURIComponent(next)}`}>Kostenlos registrieren</Link></p>
        </div>
      </div>
    </section>
  );
}
