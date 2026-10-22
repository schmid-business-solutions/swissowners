import { ResetForm } from "@/components/AuthForms";

export const metadata = { title: "Neues Passwort" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <section>
      <div className="wrap">
        <div className="auth">
          <h1 className="h2">Neues Passwort festlegen</h1>
          <ResetForm token={token} />
        </div>
      </div>
    </section>
  );
}
