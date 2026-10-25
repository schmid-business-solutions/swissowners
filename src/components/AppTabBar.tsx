"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/* Feste Navigationsleiste unten – nur in der Android-App */
const I = ({ d }: { d: React.ReactNode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const HOME = <I d={<><path d="M4 21V10l8-6 8 6v11" /><path d="M9.5 21v-6h5v6" /></>} />;
const SEARCH = <I d={<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>} />;
const HEART = <I d={<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />} />;
const USER = <I d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>} />;

export default function AppTabBar({ newRequests }: { newRequests: number }) {
  const path = usePathname();
  const tab = useSearchParams().get("tab");
  const active = {
    home: path === "/",
    search: path.startsWith("/inserate") || path.startsWith("/verwaltungsraete") && !path.startsWith("/verwaltungsraete/mandat-inserieren") && !path.startsWith("/verwaltungsraete/mein-profil") || path.startsWith("/partner") && !path.startsWith("/partner/neu"),
    add: path.startsWith("/inserat-aufgeben") || path.startsWith("/inserieren") || path.startsWith("/verwaltungsraete/mandat-inserieren") || path.startsWith("/verwaltungsraete/mein-profil") || path.startsWith("/partner/neu"),
    fav: path === "/konto" && tab === "merkliste",
    me: path.startsWith("/konto") && tab !== "merkliste",
  };
  const item = (key: keyof typeof active, href: string, label: string, icon: React.ReactNode, badge = 0) => (
    <Link href={href} className="tab-item" aria-current={active[key] ? "page" : undefined}>
      <span className="tab-ico">{icon}{badge > 0 && <span className="tab-badge">{badge > 9 ? "9+" : badge}</span>}</span>
      <span className="tab-lbl">{label}</span>
    </Link>
  );
  return (
    <nav className="app-tabbar" aria-label="App-Navigation">
      {item("home", "/", "Start", HOME)}
      {item("search", "/inserate", "Suchen", SEARCH)}
      <Link href="/inserieren" className="tab-item tab-add" aria-current={active.add ? "page" : undefined}>
        <span className="tab-plus" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
        <span className="tab-lbl">Inserieren</span>
      </Link>
      {item("fav", "/konto?tab=merkliste", "Merkliste", HEART)}
      {item("me", "/konto", "Konto", USER, newRequests)}
    </nav>
  );
}
