"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cross, Menu, User } from "./Icons";

const NAV: [string, string, string][] = [
  ["/inserate", "Anteile finden", "Alle Angebote durchsuchen"],
  ["/inserat-aufgeben", "Inserat aufgeben", "Anteile verkaufen oder Kapital suchen"],
  ["/#ablauf", "So funktioniert's", "In vier Schritten zum Abschluss"],
];

export default function Header({ userName, isAdmin, newRequests }: { userName: string | null; isAdmin: boolean; newRequests: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const nav = isAdmin ? [...NAV, ["/admin", "Admin", "Angebote prüfen und freischalten"] as [string, string, string]] : NAV;
  const current = (href: string) => (href !== "/#ablauf" && path.startsWith(href) ? "page" : undefined);

  return (
    <>
      <header className="top">
        <div className="wrap">
          <Link className="logo" href="/" aria-label="SwissOwners Startseite">
            <span className="logo-mark"><Cross size={21} /></span>
            <span className="logo-text">Swiss<i>Owners</i></span>
            <span className="beta-tag" aria-label="Beta-Version">Beta</span>
          </Link>
          <nav className="main" aria-label="Hauptnavigation">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="navlink" aria-current={current(href)}>{label}</Link>
            ))}
          </nav>
          <div className="hdr-actions">
            {userName ? (
              <Link className="icon-btn" href="/konto" aria-label={`Mein Bereich (${userName})`} title={userName}>
                <User />{newRequests > 0 && <span className="dot" />}
              </Link>
            ) : (
              <Link className="btn btn-ghost hide-sm" href="/login">Anmelden</Link>
            )}
            <Link className="btn btn-red hide-sm" href="/inserat-aufgeben">Inserat aufgeben</Link>
            <button className="icon-btn menu-btn" aria-label={open ? "Menü schliessen" : "Menü öffnen"} aria-expanded={open} onClick={() => setOpen(!open)}>
              <Menu />
            </button>
          </div>
        </div>
        <nav className="mobile-nav" aria-label="Menü" hidden={!open}>
          <div className="wrap">
            {nav.map(([href, label, sub]) => (
              <Link key={href} href={href} className="mnav-item" aria-current={current(href)}>
                <span className="mnav-txt"><span className="mnav-t">{label}</span><span className="mnav-s">{sub}</span></span>
              </Link>
            ))}
            <Link href={userName ? "/konto" : "/login"} className="mnav-item">
              <span className="mnav-txt"><span className="mnav-t">{userName ? "Mein Bereich" : "Anmelden"}</span>
                <span className="mnav-s">{userName ? "Angebote, Anfragen, Merkliste" : "Oder kostenlos registrieren"}</span></span>
            </Link>
            <Link href="/inserat-aufgeben" className="btn btn-red btn-block mnav-cta">Inserat aufgeben</Link>
          </div>
        </nav>
      </header>
      {open && <button className="menu-backdrop" aria-label="Menü schliessen" tabIndex={-1} onClick={() => setOpen(false)} />}
    </>
  );
}
