import Link from "next/link";

/** Umschalter zwischen den drei Suchbereichen – oben auf den Suchseiten (vor allem in der App) */
export default function SearchSwitch({ current }: { current: "angebote" | "vr" | "partner" }) {
  const items: [typeof current, string, string][] = [["angebote", "Angebote", "/inserate"], ["vr", "Verwaltungsräte", "/verwaltungsraete"], ["partner", "Partner", "/partner"]];
  return (
    <nav className="search-switch" aria-label="Bereich wählen">
      {items.map(([k, label, href]) => <Link key={k} href={href} aria-current={k === current ? "page" : undefined}>{label}</Link>)}
    </nav>
  );
}
