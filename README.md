# SwissOwners – Inseratemarkt für Firmenanteile

Inseratemarkt für Anteile an nicht kotierten Schweizer KMU und Startups. Betreiberin: SCHMID Business Solutions, Steffisburg (UID CHE-199.237.91). Domain: swissowners.ch.

Der ursprüngliche Klick-Prototyp (Arbeitsname anteo) ist nicht Teil dieses Repos; er liegt weiterhin unter github.com/schmid-business/anteo.

## Funktionen (MVP)

- **Konten**: Registrierung, E-Mail-Bestätigung, Login, Passwort zurücksetzen, Admin-Rolle über `ADMIN_EMAILS`
- **Inserate**: Formular in 5 Schritten (Typ, Firma, Angebot, Paket, Prüfen), Firmenname und UID bleiben verborgen, Bearbeiten mit erneuter Prüfung
- **Suche**: Filter nach Firmenart, Typ, Branche/Unterbranche (mit Zählern), Region, Betrag; Sortierung; Seitenblättern; Top-Inserate auf der Startseite
- **Prüfung**: Admin-Bereich mit Warteschlange, Prüfliste, Zefix-Link, Freischalten/Ablehnen mit Begründung per E-Mail
- **Kontaktanfragen**: digitale Vertraulichkeitserklärung (Name, Zeitpunkt, IP werden protokolliert), danach wird der Firmenname sichtbar; Nachricht geht per E-Mail an den Inserenten (Reply-To = Interessent)
- **Merkliste**
- **Pakete und Zahlung (Payrexx)**: Startangebot (gratis, 60 Tage, Plätze und Enddatum konfigurierbar), Basis/Plus/Premium mit 60 Tagen Erstlaufzeit und automatischer Verlängerung um 30 Tage über hinterlegtes Zahlungsmittel (Tokenisierung), Erinnerungen, Kündigen, Pausieren (max. 90 Tage), als verkauft markieren, Nachzahlung bei fehlgeschlagener Belastung
- AGB, Datenschutz, Impressum, Sitemap, robots.txt

Preise ändern: `src/lib/plans.ts`. Branchen, Kantone, Regionen: `src/lib/taxonomy.ts`.

## Technik

Next.js 16 (App Router, Server Actions) · TypeScript · MySQL/MariaDB über Drizzle ORM · Nodemailer (SMTP) · Payrexx REST-API. Keine externen Skripte, Schrift selbst gehostet, nur ein technisch notwendiges Sitzungs-Cookie.

Datenbank-Migrationen liegen in `drizzle/` und werden **beim Start des Servers automatisch** eingespielt (`src/instrumentation.ts`).

## Lokal entwickeln

```bash
cp .env.example .env      # Werte anpassen, lokale MySQL/MariaDB
npm install
npm run seed:demo         # optional: fiktive Demo-Inserate (nie auf Produktion!)
npm run dev               # http://localhost:3000
```

Ohne `SMTP_HOST` werden E-Mails in der Konsole ausgegeben (inkl. Bestätigungslinks).

## Deployment auf Hostinger (Business Web Hosting)

### 1. Datenbank anlegen
hPanel → **Datenbanken → MySQL-Datenbanken** → neue Datenbank und Benutzer erstellen. Daraus die `DATABASE_URL` bilden:
`mysql://BENUTZER:PASSWORT@HOST:3306/DATENBANK` (HOST ist meist `localhost`; sonst steht der Hostname im hPanel).

### 2. E-Mail-Versand
Versand über `office@schmidbusiness.com`: SMTP-Server und Port des E-Mail-Anbieters eintragen (bei Google Workspace `smtp.gmail.com`, Port 465, mit **App-Passwort**: Google-Konto → Sicherheit → Bestätigung in zwei Schritten → App-Passwörter). Absender (`MAIL_FROM`) und `SMTP_USER` sollten dieselbe Adresse sein.

### 3. Web-App aus GitHub erstellen
hPanel → **Websites → Website erstellen → Web App → Import Git Repository** → Repo `schmid-business-solutions/swissowners`, Branch `main` wählen.
- Framework: Next.js (wird erkannt) · Node.js 22 oder 24
- Build: `npm run build` · Start: `npm start`
- Danach löst jeder Push auf `main` automatisch ein neues Deployment aus.

### 4. Umgebungsvariablen setzen
Website-Dashboard → **Environment Variables** → alle Werte aus `.env.example` eintragen, dann neu deployen oder **Restart**.

### 5. Domain verbinden
- **swissowners.ch** ist registriert. Die Domain im hPanel als eigene Website anlegen (nicht als Unterordner) und die Web App darauf deployen.
- Liegt die Domain bei einem anderen Registrar: dort die Nameserver auf Hostinger setzen (Werte im hPanel unter Domains) oder einen A-Record auf die angezeigte Server-IP.
- Empfehlung: zusätzlich **firmenanteile.ch** als Such-Domain sichern und per 301-Weiterleitung auf swissowners.ch zeigen lassen.
- SSL-Zertifikat im hPanel aktivieren und `APP_URL=https://swissowners.ch` setzen.

### 6. Täglichen Abrechnungslauf einrichten
hPanel → **Erweitert → Cron Jobs** → täglich (z. B. 06:00):
```
curl -fsS "https://swissowners.ch/api/cron?key=DEIN_CRON_SECRET" > /dev/null
```
Der Lauf verschickt Erinnerungen, beendet abgelaufene Inserate, belastet Verlängerungen und räumt auf.

### 7. Payrexx einrichten
1. Payrexx-Instanz für SCHMID Business Solutions; Zahlungsmittel aktivieren (TWINT, Karten, PostFinance). **Für die automatische Verlängerung braucht es einen PSP, der Tokenisierung unterstützt.**
2. Payrexx Admin → **API** → API-Secret kopieren → `PAYREXX_INSTANCE`, `PAYREXX_API_SECRET`.
3. Payrexx Admin → **Webhooks** → URL `https://swissowners.ch/api/payrexx/webhook` (JSON).
4. Im Testmodus durchspielen: Paket bestellen → Rückleitung → Inserat «In Prüfung»; im Admin freischalten; mit `period_end` in der Vergangenheit den Cron aufrufen → Verlängerung muss belastet werden.

Ohne Payrexx-Konfiguration funktioniert das Startangebot trotzdem; bezahlte Pakete zeigen dann einen Hinweis.

### 8. Ersten Admin anlegen
`ADMIN_EMAILS` enthält deine Adresse → mit dieser Adresse registrieren. Alternativ: `npm run make-admin -- adresse@example.ch`.

## Anmeldung mit Google und LinkedIn

Die Buttons erscheinen auf Login und Registrierung, sobald ID und Secret des Anbieters gesetzt sind. Wer sich so anmeldet, bekommt ein Konto mit bestätigter E-Mail-Adresse; existiert die Adresse schon, wird das Konto verknüpft.

**Google** (console.cloud.google.com)
1. Projekt anlegen → **Google Auth Platform** (bzw. APIs & Dienste → OAuth-Zustimmungsbildschirm): App-Name «SwissOwners», Support-E-Mail, Zielgruppe **Extern**, Domain swissowners.ch, Links zu /datenschutz und /agb. App **veröffentlichen** (nicht im Testmodus lassen).
2. **Clients → Client erstellen → Webanwendung**. Autorisierter Weiterleitungs-URI: `https://swissowners.ch/api/auth/google/callback`
3. Client-ID und Client-Secret als `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` eintragen.

**LinkedIn** (linkedin.com/developers/apps)
1. **Create app**: Name «SwissOwners», verknüpfte **LinkedIn-Unternehmensseite** (Pflicht), Logo, Datenschutz-URL.
2. Reiter **Products** → «**Sign In with LinkedIn using OpenID Connect**» anfordern (wird sofort freigeschaltet).
3. Reiter **Auth** → Authorized redirect URL: `https://swissowners.ch/api/auth/linkedin/callback`
4. Client ID und Primary Client Secret als `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` eintragen.

Danach in Hostinger **Restart**.

**Offizielle Logos auf den Buttons:** Die Buttons sind farblich nach den Vorgaben von Google (weiss, grauer Rand) und LinkedIn (LinkedIn-Blau) gestaltet. Die Logos selbst aus den offiziellen Branding-Paketen herunterladen und als `public/brand/google.svg` bzw. `public/brand/linkedin.svg` (oder `.png`) ablegen – sie erscheinen dann automatisch links im Button.

## Vor dem Livegang

- [ ] Impressum: Postadresse ergänzen (bei Online-Verkauf von Paketen nötig, Art. 3 Abs. 1 lit. s UWG)
- [ ] Datenschutz: Hosting-Region von Hostinger eintragen
- [ ] AGB und Datenschutz final formulieren
- [ ] Payrexx-Tokenisierung im Testmodus verifizieren (siehe oben)
- [ ] Wortmarke «SwissOwners» beim IGE prüfen und anmelden (Klassen 35, 36, 42)

## Nicht im MVP (nächste Schritte)

Investorenprofil und Suchabo · Upload von Unterlagen (Datenraum) · ID-Prüfung der Inserenten · Französisch/Italienisch · Rechnung als Zahlungsart · Statistiken für Inserenten
