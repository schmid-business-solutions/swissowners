"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cross, Menu, User } from "./Icons";

const NAV: [string, string, string][] = [
  ["/inserate", "Anteile finden", "Alle Angebote durchsuchen"],
  ["/finanzieren", "Finanzieren", "Eigenkapital für Ihre Firma finden"],
  ["/verwaltungsraete", "Verwaltungsräte", "VR-Mandate und VR-Profile"],
  ["/partner", "Partner", "M&A-Berater, Startup-Förderer, Investoren"],
];

type Account = { firstName: string; lastName: string; avatarVersion: number | null };

function Avatar({ a }: { a: Account }) {
  const initials = ((a.firstName[0] ?? "") + (a.lastName[0] ?? "")).toUpperCase() || "?";
  return a.avatarVersion
    ? <img className="avatar" src={`/api/avatar?v=${a.avatarVersion}`} alt="" width={36} height={36} />
    : <span className="avatar avatar-initials" aria-hidden="true">{initials}</span>;
}

export default function Header({ userName, account, isAdmin, newRequests }: { userName: string | null; account: Account | null; isAdmin: boolean; newRequests: number }) {
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
            {account ? (
              <Link className="acct-btn" href="/konto" aria-label={`Mein Bereich (${userName})`} title={`${userName} · Mein Bereich`}>
                <span className="avatar-wrap"><Avatar a={account} />{newRequests > 0 && <span className="dot" />}</span>
                <span className="acct-name hide-sm web-only">{account.firstName}</span><span className="acct-name app-only">{account.firstName} {account.lastName}</span>
              </Link>
            ) : (
              <Link className="acct-btn acct-out" href="/login" aria-label="Anmelden">
                <span className="avatar avatar-out"><User size={20} /></span>
                <span className="acct-name hide-sm">Anmelden</span>
              </Link>
            )}
            <Link className="btn btn-red hide-sm" href="/inserieren">Inserieren</Link>
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
            <Link href="/inserieren" className="btn btn-red btn-block mnav-cta">Inserieren</Link>
          </div>
        </nav>
      </header>
      {open && <button className="menu-backdrop" aria-label="Menü schliessen" tabIndex={-1} onClick={() => setOpen(false)} />}
    </>
  );
}
