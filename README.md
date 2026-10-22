# anteo.swiss – Inseratemarkt für Firmenanteile

Inseratemarkt für Anteile an nicht kotierten Schweizer KMU und Startups. Betreiberin: SCHMID Business Solutions, Steffisburg (UID CHE-199.237.91). «anteo» ist Arbeitsname.

Der ursprüngliche Klick-Prototyp liegt weiterhin als `index.html` im Repo (GitHub Page). Die Applikation ignoriert diese Datei.

## Funktionen (MVP)

- **Konten**: Registrierung, E-Mail-Bestätigung, Login, Passwort zurücksetzen, Admin-Rolle über `ADMIN_EMAILS`
- **Inserate**: Formular in 5 Schritten (Typ, Firma, Angebot, Paket, Prüfen), Firmenname und UID bleiben verborgen, Bearbeiten mit erneuter Prüfung
- **Suche**: Filter nach Firmenart, Typ, Branche/Unterbranche (mit Zählern), Region, Betrag; Sortierung; Seitenblättern; Top-Inserate auf der Startseite
- **Prüfung**: Admin-Bereich mit Warteschlange, Prüfliste, Zefix-Link, Freischalten/Ablehnen mit Begründung per E-Mail
- **Kontaktanfragen**: digitale Vertraulichkeitserklärung (Name, Zeitpunkt, IP werden protokolliert), danach wird der Firmenname sichtbar; Nachricht geht per E-Mail an den Inserenten (Reply-To = Interessent)
- **Merkliste**
- **Pakete und Zahlung (Payrexx)**: Startangebot (gratis, 60 Tage, Plätze und Enddatum konfigurierbar), Basis/Plus/Premium mit 60 Tagen Erstlaufzeit und automatischer Verlängerung um 30 Tage über hinterlegtes Zahlungsmittel (Tokenisierung), Erinnerungen, Kündigen, Pausieren (max. 90 Tage), als verkauft markieren, Nachzahlung bei fehlgeschlagener Belastung
- AGB, Datenschutz, Impressum (Entwürfe), Sitemap, robots.txt

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

### 2. E-Mail-Postfach anlegen
hPanel → **E-Mails** → Postfach `noreply@anteo.swiss` erstellen. SMTP: `smtp.hostinger.com`, Port 465.

### 3. Web-App aus GitHub erstellen
hPanel → **Websites → Website erstellen → Web App → Import Git Repository** → Repo `schmid-business/anteo`, Branch `main` wählen.
- Framework: Next.js (wird erkannt) · Node.js 22 oder 24
- Build: `npm run build` · Start: `npm start`
- Danach löst jeder Push auf `main` automatisch ein neues Deployment aus.

### 4. Umgebungsvariablen setzen
Website-Dashboard → **Environment Variables** → alle Werte aus `.env.example` eintragen, dann neu deployen oder **Restart**.

### 5. Domain verbinden
- Die Domain muss im hPanel als eigene Website angelegt sein (nicht als Unterordner).
- **.swiss** kann nur über einen akkreditierten Registrar registriert werden und verlangt einen objektiven Bezug zum Namen (Firmenname oder eingetragene Marke). Beim Registrar die Nameserver auf Hostinger setzen (Werte im hPanel unter Domains) oder einen A-Record auf die angezeigte Server-IP.
- Zusätzlich die .ch-Variante sichern und per Weiterleitung auf die Hauptdomain zeigen lassen.
- SSL-Zertifikat im hPanel aktivieren und `APP_URL` auf die finale Domain setzen.

### 6. Täglichen Abrechnungslauf einrichten
hPanel → **Erweitert → Cron Jobs** → täglich (z. B. 06:00):
```
curl -fsS "https://anteo.swiss/api/cron?key=DEIN_CRON_SECRET" > /dev/null
```
Der Lauf verschickt Erinnerungen, beendet abgelaufene Inserate, belastet Verlängerungen und räumt auf.

### 7. Payrexx einrichten
1. Payrexx-Instanz für SCHMID Business Solutions; Zahlungsmittel aktivieren (TWINT, Karten, PostFinance). **Für die automatische Verlängerung braucht es einen PSP, der Tokenisierung unterstützt.**
2. Payrexx Admin → **API** → API-Secret kopieren → `PAYREXX_INSTANCE`, `PAYREXX_API_SECRET`.
3. Payrexx Admin → **Webhooks** → URL `https://anteo.swiss/api/payrexx/webhook` (JSON).
4. Im Testmodus durchspielen: Paket bestellen → Rückleitung → Inserat «In Prüfung»; im Admin freischalten; mit `period_end` in der Vergangenheit den Cron aufrufen → Verlängerung muss belastet werden.

Ohne Payrexx-Konfiguration funktioniert das Startangebot trotzdem; bezahlte Pakete zeigen dann einen Hinweis.

### 8. Ersten Admin anlegen
`ADMIN_EMAILS` enthält deine Adresse → mit dieser Adresse registrieren. Alternativ: `npm run make-admin -- adresse@example.ch`.

## Vor dem Livegang

- [ ] Impressum: Postadresse ergänzen (bei Online-Verkauf von Paketen nötig, Art. 3 Abs. 1 lit. s UWG)
- [ ] Datenschutz: Hosting-Region von Hostinger eintragen
- [ ] AGB und Datenschutz final formulieren
- [ ] Payrexx-Tokenisierung im Testmodus verifizieren (siehe oben)
- [ ] Marke «anteo» (bzw. finaler Name) beim IGE anmelden, Domain registrieren

## Nicht im MVP (nächste Schritte)

Investorenprofil und Suchabo · Upload von Unterlagen (Datenraum) · ID-Prüfung der Inserenten · Französisch/Italienisch · Rechnung als Zahlungsart · Statistiken für Inserenten
