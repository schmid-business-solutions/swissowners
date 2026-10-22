import Link from "next/link";
import { eq } from "drizzle-orm";
import { ResendVerification } from "@/components/AuthForms";
import { Check } from "@/components/Icons";
import { consumeAuthToken, getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export const metadata = { title: "E-Mail bestätigen" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; next?: string; neu?: string }> }) {
  const { token, next = "/konto", neu } = await searchParams;
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/konto";
  let verified = false;
  let failed = false;
  if (token) {
    const userId = await consumeAuthToken(token, "verify");
    if (userId) {
      await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
      verified = true;
    } else failed = true;
  }
  const user = await getUser();
  if (user?.emailVerifiedAt) verified = true;

  return (
    <section>
      <div className="wrap">
        <div className="auth">
          {verified ? (
            <>
              <div className="notice" style={{ background: "var(--ok-soft)" }}><Check size={22} /><span><b>E-Mail-Adresse bestätigt.</b> Vielen Dank.</span></div>
              <Link className="btn btn-red" href={user ? target : "/login"}>{user ? "Weiter" : "Anmelden"}</Link>
            </>
          ) : (
            <>
              <h1 className="h2">Bitte bestätigen Sie Ihre E-Mail-Adresse</h1>
              {failed && <p className="flash err">Der Link ist abgelaufen oder wurde bereits verwendet.</p>}
              <p className="muted">
                {neu ? "Ihr Konto ist erstellt. " : ""}Wir haben Ihnen eine E-Mail{user ? ` an ${user.email}` : ""} mit einem Bestätigungslink gesendet.
                Erst danach können Sie Inserate erfassen und Anfragen senden.
              </p>
              {user && <ResendVerification />}
              <Link className="link" href="/inserate">Inzwischen Inserate ansehen</Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
