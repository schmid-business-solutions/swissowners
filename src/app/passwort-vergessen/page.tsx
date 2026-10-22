import { ResetRequestForm } from "@/components/AuthForms";

export const metadata = { title: "Passwort vergessen" };

export default function ForgotPage() {
  return (
    <section>
      <div className="wrap">
        <div className="auth">
          <div className="stack" style={{ gap: 8 }}>
            <h1 className="h2">Passwort vergessen</h1>
            <p className="muted">Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen.</p>
          </div>
          <ResetRequestForm />
        </div>
      </div>
    </section>
  );
}
