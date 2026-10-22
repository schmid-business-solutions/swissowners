export const metadata = { title: "Datenschutzerklärung" };

export default function PrivacyPage() {
  return (
    <section><div className="wrap"><article className="legal">
      <p className="eyebrow">Stand: Entwurf Oktober 2026</p>
      <h1 className="h2">Datenschutzerklärung</h1>
      <p>Diese Erklärung beschreibt, wie SCHMID Business Solutions, Steffisburg (UID CHE-199.237.91), als Verantwortliche Personendaten im Zusammenhang mit SwissOwners bearbeitet. Es gilt das Schweizer Datenschutzgesetz (DSG).</p>

      <h2>1. Welche Daten wir bearbeiten</h2>
      <ul>
        <li><b>Konto:</b> Vorname, Nachname, E-Mail-Adresse, Passwort (verschlüsselt gespeichert), optional Telefonnummer.</li>
        <li><b>Angebote:</b> Angaben zur Gesellschaft, Firmenname und UID, Beschreibung, Preisangaben, Aufrufzahlen.</li>
        <li><b>Anfragen:</b> Nachricht, Zeitpunkt und IP-Adresse der digitalen Vertraulichkeitserklärung, Name der unterzeichnenden Person.</li>
        <li><b>Zahlungen:</b> Betrag, Paket, Zeitpunkt und Referenzen des Zahlungsdienstleisters. Karten- und TWINT-Daten erhalten wir nicht.</li>
        <li><b>Anmeldung mit Google oder LinkedIn:</b> Wenn Sie diese Anmeldeart wählen, erhalten wir vom jeweiligen Anbieter Ihren Namen, Ihre E-Mail-Adresse und eine Kennnummer Ihres Kontos. Weitere Daten (z. B. Kontakte oder Beiträge) erhalten wir nicht. Für die Bearbeitung beim Anbieter gelten dessen Datenschutzbestimmungen (Google LLC bzw. LinkedIn Ireland Unlimited Company).</li>
        <li><b>Technik:</b> Server-Protokolle (IP-Adresse, Zeitpunkt, aufgerufene Seite) und ein technisch notwendiges Sitzungs-Cookie für die Anmeldung. Wir verwenden keine Tracking- oder Werbe-Cookies.</li>
      </ul>

      <h2>2. Zwecke</h2>
      <p>Betrieb der Plattform, Prüfung und Veröffentlichung von Angeboten, Weiterleitung von Anfragen an Inserierende, Abrechnung der Pakete, Kommunikation per E-Mail (z. B. Bestätigungen, Erinnerungen vor Verlängerungen), Missbrauchsbekämpfung und Erfüllung gesetzlicher Pflichten.</p>

      <h2>3. Weitergabe</h2>
      <ul>
        <li><b>An Inserierende:</b> Wenn Sie eine Anfrage senden, geben wir Name, E-Mail-Adresse, Telefonnummer (falls angegeben) und Nachricht an die inserierende Person weiter.</li>
        <li><b>An Interessierte:</b> Firmenname und UID eines Angebots werden erst nach unterzeichneter Vertraulichkeitserklärung angezeigt. Ihre persönlichen Kontaktdaten als Inserent werden nicht angezeigt.</li>
        <li><b>Dienstleister:</b> Hosting (Hostinger International Ltd., Rechenzentrum in [Region ergänzen]), E-Mail-Versand (Google, Gmail; Datenbearbeitung auch ausserhalb der Schweiz, z. B. in den USA), Zahlungsabwicklung (Payrexx AG, Schweiz). Sie bearbeiten Daten nur in unserem Auftrag.</li>
      </ul>

      <h2>4. Aufbewahrung</h2>
      <p>Kontodaten bewahren wir auf, solange das Konto besteht. Buchhaltungsrelevante Daten bewahren wir 10 Jahre auf. Server-Protokolle löschen wir nach spätestens 90 Tagen.</p>

      <h2>5. Ihre Rechte</h2>
      <p>Sie können Auskunft, Berichtigung, Löschung und Herausgabe Ihrer Daten verlangen sowie der Bearbeitung widersprechen. Kontakt: <a href="mailto:schmidmobile@gmail.com">schmidmobile@gmail.com</a>. Sie können sich zudem beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) beschweren.</p>

      <h2>6. Datensicherheit</h2>
      <p>Die Übertragung erfolgt verschlüsselt (HTTPS). Passwörter speichern wir ausschliesslich als kryptografischen Hash.</p>
    </article></div></section>
  );
}
