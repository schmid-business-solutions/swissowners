import Link from "next/link";

export default function NotFound() {
  return (
    <section><div className="wrap"><div className="empty">
      <h1 className="h2">Seite nicht gefunden</h1>
      <p className="muted">Das Inserat ist vielleicht nicht mehr online.</p>
      <Link className="btn btn-red" href="/inserate">Zu den Inseraten</Link>
    </div></div></section>
  );
}
