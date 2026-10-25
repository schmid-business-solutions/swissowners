import Link from "next/link";
import { Arrow } from "@/components/Icons";

export const metadata = { title: "Inserieren", description: "Anteile verkaufen, Kapital suchen, ein VR-Mandat inserieren oder sich als Verwaltungsrat oder Partner vorstellen." };

const ITEMS: { href: string; pill: [string, string]; title: string; text: string }[] = [
  { href: "/inserat-aufgeben?typ=sell", pill: ["sell", "Anteile verkaufen"], title: "Ich verkaufe Aktien oder GmbH-Anteile", text: "Als Aktionär, Gesellschafter oder im Auftrag" },
  { href: "/inserat-aufgeben?typ=cap", pill: ["cap", "Kapital gesucht"], title: "Meine Firma sucht Eigenkapital", text: "Kapitalerhöhung bei Startup oder KMU" },
  { href: "/verwaltungsraete/mandat-inserieren", pill: ["vr", "VR-Mandat"], title: "Wir suchen eine Verwaltungsrätin oder einen Verwaltungsrat", text: "Auch Beirat oder Präsidium – Firma bleibt anonym" },
  { href: "/verwaltungsraete/mein-profil", pill: ["vr", "VR-Profil"], title: "Ich suche ein Verwaltungsratsmandat", text: "Profil erstellen, auf Wunsch anonym" },
  { href: "/partner/neu", pill: ["seg-kmu", "Partnerprofil"], title: "Wir sind Berater, Förderer oder Investoren", text: "Profil im Verzeichnis, Inserate im Auftrag von Kunden" },
];

export default function ChoosePage() {
  return (
    <section style={{ paddingBlock: 36 }}>
      <div className="wrap stack" style={{ gap: 22, maxWidth: 820 }}>
        <div className="stack" style={{ gap: 6 }}>
          <h1 className="h2">Was möchten Sie inserieren?</h1>
          <p className="muted">Alle Inserate werden vor der Freischaltung geprüft. Profile und VR-Mandate sind während der Beta kostenlos.</p>
        </div>
        <div className="stack" style={{ gap: 12 }}>
          {ITEMS.map((i) => (
            <Link key={i.href} href={i.href} className="choice choose-row">
              <span className="stack" style={{ gap: 6, minWidth: 0 }}>
                <span className={`pill ${i.pill[0]}`} style={{ alignSelf: "flex-start" }}>{i.pill[1]}</span>
                <b>{i.title}</b><span className="small muted">{i.text}</span>
              </span>
              <Arrow />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
