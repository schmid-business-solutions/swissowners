import { NextResponse, type NextRequest } from "next/server";

/* App-Modus (Android-App): Wer die App öffnet, sieht zuerst das Intro und muss sich anmelden.
   Erkannt wird die App am Einstieg über /app (Start-URL der App) oder am Referer «android-app://ch.swissowners.app»,
   den Chrome beim Start einer Trusted Web Activity mitschickt. Danach merkt sich ein Sitzungs-Cookie den App-Modus.
   Im normalen Browser ändert sich nichts. */

const APP_COOKIE = "swo_app";
const SESSION_COOKIE = "swo_session";

/* Ohne Anmeldung erreichbar (Anmeldung, Registrierung, Rechtliches) */
const PUBLIC = ["/app", "/login", "/registrieren", "/passwort-vergessen", "/passwort-neu", "/bestaetigen", "/agb", "/datenschutz", "/impressum"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const referer = req.headers.get("referer") ?? "";
  const entering = pathname === "/app" || pathname.startsWith("/app/") || referer.startsWith("android-app://ch.swissowners.app");
  const inApp = entering || req.cookies.get(APP_COOKIE)?.value === "1";
  if (!inApp) return NextResponse.next();

  const loggedIn = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  let res: NextResponse;
  if (!loggedIn && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    res = NextResponse.redirect(url);
  } else {
    res = NextResponse.next();
  }
  if (entering) {
    res.cookies.set(APP_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  }
  return res;
}

export const config = {
  matcher: [
    /* Nur Seitenaufrufe: keine API-Routen, Next.js-Dateien, Icons, Manifest oder sonstige Dateien mit Endung */
    "/((?!api/|_next/|\\.well-known/|icons/|brand/|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
