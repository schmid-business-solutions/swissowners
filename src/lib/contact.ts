/* Themen des Kontaktformulars – wird von Seite, Formular, Server-Action und Admin gemeinsam verwendet. */

export type ExtraField = {
  name: string;
  label: string;
  type: "text" | "select" | "rating";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export type Topic = {
  id: string;
  group: "hilfe" | "feedback" | "zusammenarbeit";
  label: string;
  text: string;
  icon: string;
  placeholder: string;
  companyRequired?: boolean;
  extra?: ExtraField[];
  note?: { text: string; href: string; link: string };
};

export const CONTACT_GROUPS: { id: Topic["group"]; label: string }[] = [
  { id: "hilfe", label: "Hilfe und Support" },
  { id: "feedback", label: "Feedback und Ideen" },
  { id: "zusammenarbeit", label: "Zusammenarbeit" },
];

const NR: ExtraField = { name: "ref", label: "Inserat-, Mandats- oder Profilnummer", type: "text", placeholder: "z. B. SO-1024 oder VR-1003", hint: "Falls vorhanden" };

export const CONTACT_TOPICS: Topic[] = [
  /* Hilfe */
  { id: "frage", group: "hilfe", label: "Allgemeine Frage", text: "Wie SwissOwners funktioniert, was es kostet", icon: "help",
    placeholder: "Wie können wir Ihnen helfen?" },
  { id: "inserat", group: "hilfe", label: "Hilfe zu Inserat oder Profil", text: "Erfassen, Prüfung, Änderungen, Verlängerung", icon: "doc",
    placeholder: "Worum geht es bei Ihrem Inserat oder Profil?", extra: [NR] },
  { id: "konto", group: "hilfe", label: "Konto und Anmeldung", text: "Login, Passwort, E-Mail-Bestätigung", icon: "user",
    placeholder: "Was funktioniert bei der Anmeldung oder im Konto nicht?" },
  { id: "zahlung", group: "hilfe", label: "Zahlung und Rechnung", text: "Pakete, Belastungen, Kündigung", icon: "card",
    placeholder: "Um welche Zahlung oder welches Paket geht es?", extra: [NR] },

  /* Feedback */
  { id: "fehler", group: "feedback", label: "Fehler melden", text: "Etwas funktioniert nicht wie erwartet", icon: "bug",
    placeholder: "Was haben Sie gemacht, was ist passiert und was hätten Sie erwartet?",
    extra: [
      { name: "page", label: "Auf welcher Seite?", type: "text", placeholder: "Link oder Name der Seite" },
      { name: "device", label: "Gerät", type: "select", required: true, options: ["Computer", "Handy (Browser)", "Tablet", "Android-App", "Andere"] },
      { name: "browser", label: "Browser", type: "select", options: ["Chrome", "Safari", "Edge", "Firefox", "Andere / weiss nicht"] },
    ] },
  { id: "idee", group: "feedback", label: "Funktion wünschen", text: "Ideen für neue Funktionen und Verbesserungen", icon: "bulb",
    placeholder: "Welche Funktion wünschen Sie sich, und welches Problem würde sie für Sie lösen?",
    extra: [{ name: "priority", label: "Wie wichtig ist das für Sie?", type: "select", required: true, options: ["Wäre schön", "Wichtig", "Unverzichtbar"] }] },
  { id: "feedback", group: "feedback", label: "Feedback, Lob und Kritik", text: "Was gefällt Ihnen, was nicht?", icon: "chat",
    placeholder: "Was gefällt Ihnen an SwissOwners, und was sollten wir besser machen?",
    extra: [{ name: "rating", label: "Ihre Gesamtbewertung", type: "rating" }] },
  { id: "melden", group: "feedback", label: "Inhalt melden", text: "Verdächtiges Inserat oder Profil", icon: "flag",
    placeholder: "Was ist Ihnen aufgefallen? Jeder Hinweis wird von einem Menschen geprüft.",
    extra: [
      { ...NR, label: "Link oder Nummer des Eintrags", required: true, hint: undefined },
      { name: "reason", label: "Grund", type: "select", required: true, options: ["Falsche oder irreführende Angaben", "Verdacht auf Betrug", "Verletzt Rechte Dritter", "Unangemessener Inhalt", "Anderer Grund"] },
    ] },

  /* Zusammenarbeit */
  { id: "werbung", group: "zusammenarbeit", label: "Werbepartnerschaft", text: "Werbung, Sponsoring, Newsletter", icon: "megaphone", companyRequired: true,
    placeholder: "Welche Zielgruppe möchten Sie erreichen, und welche Form der Partnerschaft stellen Sie sich vor?",
    extra: [
      { name: "website", label: "Website", type: "text", placeholder: "www.beispiel.ch" },
      { name: "budget", label: "Budget pro Jahr", type: "select", options: ["Noch offen", "Bis CHF 1'000", "CHF 1'000–5'000", "CHF 5'000–20'000", "Über CHF 20'000"] },
    ] },
  { id: "kooperation", group: "zusammenarbeit", label: "Kooperation und Integration", text: "Verbände, Plattformen, Events, Schnittstellen", icon: "link", companyRequired: true,
    placeholder: "Wer sind Sie, und wie könnten wir zusammenarbeiten?",
    extra: [
      { name: "website", label: "Website", type: "text", placeholder: "www.beispiel.ch" },
      { name: "kind", label: "Art der Zusammenarbeit", type: "select", options: ["Verband oder Netzwerk", "Plattform oder Software", "Event oder Veranstaltung", "Hochschule oder Förderprogramm", "Andere"] },
    ] },
  { id: "partner", group: "zusammenarbeit", label: "Partner werden", text: "M&A, Treuhand, Förderer, Investoren", icon: "handshake", companyRequired: true,
    placeholder: "Erzählen Sie uns kurz von Ihrer Firma und Ihren Kunden.",
    note: { text: "Ein Partnerprofil können Sie auch direkt selbst erstellen – kostenlos während der Beta.", href: "/partner/neu", link: "Partnerprofil erstellen" },
    extra: [{ name: "website", label: "Website", type: "text", placeholder: "www.beispiel.ch" }] },
  { id: "presse", group: "zusammenarbeit", label: "Presse und Medien", text: "Anfragen, Interviews, Bildmaterial", icon: "news", companyRequired: true,
    placeholder: "Worum geht es in Ihrem Beitrag, und welche Informationen benötigen Sie?",
    extra: [{ name: "deadline", label: "Redaktionsschluss", type: "text", placeholder: "z. B. 15. November" }] },

  /* Sonstiges */
  { id: "datenschutz", group: "hilfe", label: "Datenschutz und Recht", text: "Auskunft, Löschung, rechtliche Anliegen", icon: "shield",
    placeholder: "Bitte beschreiben Sie Ihr Anliegen. Für Auskünfte verwenden Sie bitte die E-Mail-Adresse Ihres Kontos.",
    extra: [{ name: "request", label: "Anliegen", type: "select", required: true, options: ["Auskunft über meine Daten", "Berichtigung", "Löschung von Daten oder Konto", "Rechtliches Anliegen", "Anderes"] }] },
  { id: "sonstiges", group: "feedback", label: "Etwas anderes", text: "Alles, was sonst nirgends passt", icon: "dots",
    placeholder: "Ihre Nachricht an uns" },
];

export const topicById = (id: string) => CONTACT_TOPICS.find((t) => t.id === id);
export const contactNo = (id: number) => `K-${1000 + id}`;
