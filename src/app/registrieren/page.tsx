import Link from "next/link";
import { RegisterForm } from "@/components/AuthForms";
import SocialLogin from "@/components/SocialLogin";

export const metadata = { title: "Registrieren" };

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/konto" } = await searchParams;
  return (
    <section>
      <div className="wrap">
        <div className="auth">
          <div className="stack" style={{ gap: 8 }}>
            <h1 className="h2">Konto erstellen</h1>
            <p className="muted">Mit einem Konto erfassen Sie Angebote, senden Anfragen und merken sich Angebote.</p>
          </div>
          <SocialLogin next={next} mode="register" />
          <RegisterForm next={next} />
          <p className="muted">Bereits registriert? <Link className="link" href={`/login?next=${encodeURIComponent(next)}`}>Anmelden</Link></p>
        </div>
      </div>
    </section>
  );
}
