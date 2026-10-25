/* Zweistufige Branchenliste, angelehnt an NOGA 2008 (BFS), in Alltagssprache – übernommen aus dem Prototyp */
export const TAX: [string, string[]][] = [
  ["Software und IT", ["Unternehmenssoftware (SaaS)", "Fintech und Insurtech", "Plattformen und Marktplätze", "KI und Datenanalyse", "Cybersecurity", "IT-Dienstleistungen", "Hardware und Elektronik"]],
  ["Gesundheit und Life Sciences", ["Medtech", "Biotech und Pharma", "Digital Health", "Praxen und Kliniken", "Pflege und Heime", "Apotheken und Drogerien", "Therapie und Prävention"]],
  ["Industrie und Produktion", ["Präzisionsmechanik", "Maschinen- und Anlagenbau", "Uhren und Schmuck", "Elektrotechnik und Automation", "Kunststoff und Chemie", "Druck und Verpackung", "Textil und Bekleidung"]],
  ["Bau und Immobilien", ["Hoch- und Tiefbau", "Ingenieur- und Architekturbüros", "Gebäudetechnik", "Innenausbau und Maler", "Immobilien und Verwaltung"]],
  ["Handwerk und Gewerbe", ["Schreinerei und Holzbau", "Metallbau und Schlosserei", "Garagen und Autogewerbe", "Gartenbau", "Coiffeur und Kosmetik", "Reinigung und Facility Services"]],
  ["Gastronomie und Lebensmittel", ["Restaurants und Cafés", "Bäckerei und Confiserie", "Brauerei und Getränke", "Metzgerei", "Lebensmittelproduktion", "Catering"]],
  ["Tourismus und Freizeit", ["Hotellerie", "Bergbahnen und Freizeitanlagen", "Reisen und Incoming", "Sport und Fitness", "Kultur und Events"]],
  ["Handel", ["Detailhandel", "Grosshandel", "Onlinehandel", "Fahrzeughandel"]],
  ["Unternehmensdienstleistungen", ["Treuhand und Buchhaltung", "Rechts- und Steuerberatung", "Unternehmensberatung", "Marketing und Kommunikation", "Personal und Temporär", "Finanz- und Versicherungsberatung"]],
  ["Energie und Umwelt", ["Solar und erneuerbare Energie", "Energieeffizienz", "Recycling und Entsorgung", "Wasser- und Umwelttechnik", "E-Mobilität"]],
  ["Transport und Logistik", ["Transport und Spedition", "Kurier und Lieferdienste", "Lager und Logistik", "Personenverkehr"]],
  ["Bildung und Medien", ["Schulen und Weiterbildung", "Kinderbetreuung", "Verlage und Medien", "Film, Musik und Games"]],
  ["Landwirtschaft und Weinbau", ["Landwirtschaft", "Weinbau und Kellerei", "Agrartechnik"]],
  ["Andere Branche", []],
];

export const BRANCHEN = TAX.map((t) => t[0]);
export const subsOf = (main: string): string[] => {
  const t = TAX.find((x) => x[0] === main);
  return t ? [...t[1], "Andere"] : ["Andere"];
};

/* Kanton → Region (für den Regionenfilter). Regionen wie im Prototyp. */
export const KANTON_REGION: Record<string, string> = {
  Bern: "Bern", Solothurn: "Bern",
  Zürich: "Zürich",
  "Basel-Stadt": "Basel und Aargau", "Basel-Landschaft": "Basel und Aargau", Aargau: "Basel und Aargau",
  Luzern: "Zentralschweiz", Uri: "Zentralschweiz", Schwyz: "Zentralschweiz", Obwalden: "Zentralschweiz", Nidwalden: "Zentralschweiz", Zug: "Zentralschweiz",
  Glarus: "Ostschweiz", Schaffhausen: "Ostschweiz", "Appenzell Ausserrhoden": "Ostschweiz", "Appenzell Innerrhoden": "Ostschweiz", "St. Gallen": "Ostschweiz", Graubünden: "Ostschweiz", Thurgau: "Ostschweiz",
  Freiburg: "Romandie", Waadt: "Romandie", Genf: "Romandie", Neuenburg: "Romandie", Jura: "Romandie", Wallis: "Romandie",
  Tessin: "Tessin",
};
export const KANTONE = Object.keys(KANTON_REGION).sort((a, b) => a.localeCompare(b, "de-CH"));
export const REGIONEN = ["Bern", "Zürich", "Basel und Aargau", "Zentralschweiz", "Ostschweiz", "Romandie", "Tessin"];

export const PHASEN = ["Pre-Seed", "Seed", "Series A", "Series B oder später"];
export const RECHTSFORMEN = ["AG", "GmbH", "Genossenschaft"];
export const UMSATZKLASSEN = ["unter CHF 0,5 Mio.", "CHF 0,5–1 Mio.", "CHF 1–2 Mio.", "CHF 2–5 Mio.", "CHF 5–10 Mio.", "CHF 10–25 Mio.", "über CHF 25 Mio."];
export const AKTIENKATEGORIEN: [string, string][] = [["stamm", "Stammaktien"], ["vorzug", "Vorzugsaktien"], ["unklar", "Weiss ich nicht"]];

export const BETRAG: [string, string][] = [
  ["all", "Beliebig"],
  ["50", "bis CHF 50'000"],
  ["250", "CHF 50'000 – 250'000"],
  ["1000", "CHF 250'000 – 1 Mio."],
  ["max", "über CHF 1 Mio."],
];

export const SORTS: [string, string][] = [
  ["relevanz", "Relevanz"],
  ["neu", "Neueste zuerst"],
  ["betrag_auf", "Betrag: tiefster zuerst"],
  ["betrag_ab", "Betrag: höchster zuerst"],
  ["views", "Meistgesehen"],
];

export const TYPE_LABEL = { sell: "Anteile verkaufen", cap: "Kapital gesucht" } as const;
export const SEG_LABEL = { kmu: "KMU", startup: "Startup" } as const;

/* ---------- Partner ---------- */
export const ORG_KIND_LABEL = {
  ma: "M&A-Beratung", nachfolge: "Nachfolgeberatung", treuhand: "Treuhand", bewertung: "Unternehmensbewertung", recht: "Anwaltskanzlei", bank: "Bank",
  foerderung: "Öffentliche Startup-Förderung", park: "Innovationspark oder Gründerzentrum", inkubator: "Inkubator oder Accelerator", vc: "Venture Capital", angels: "Business-Angel-Netzwerk",
} as const;
export const ORG_GROUPS = {
  berater: { label: "Berater und M&A", kinds: ["ma", "nachfolge", "treuhand", "bewertung", "recht", "bank"] },
  startup: { label: "Startup-Förderer und Investoren", kinds: ["foerderung", "park", "inkubator", "vc", "angels"] },
} as const;
export type OrgGroup = keyof typeof ORG_GROUPS;
export const orgGroupOf = (kind: string): OrgGroup => ((ORG_GROUPS.startup.kinds as readonly string[]).includes(kind) ? "startup" : "berater");
export const ORG_SERVICES = [
  "Unternehmensverkauf", "Unternehmenskauf", "Nachfolgeregelung", "Unternehmensbewertung", "Kapitalsuche und Finanzierung", "Due Diligence",
  "Recht und Verträge", "Steuern", "Coaching und Programme", "Investitionen", "Netzwerk und Events", "Büros und Infrastruktur",
];

/* ---------- Verwaltungsräte ---------- */
export const BOARD_ROLE_LABEL = { praesidium: "Präsidium", mitglied: "Mitglied", delegiert: "Delegierte/r des VR", beirat: "Beirat" } as const;
export const VR_SKILLS = [
  "Strategie", "Finanzen und Controlling", "Recht und Compliance", "Digitalisierung und IT", "Marketing und Vertrieb", "Personal und Führung",
  "Produktion und Operations", "Nachfolge und M&A", "Internationalisierung", "Nachhaltigkeit und ESG", "Risikomanagement", "Startups und Innovation",
];
export const SPRACHEN = ["Deutsch", "Französisch", "Italienisch", "Englisch"];
export const KAPAZITAET = ["1 weiteres Mandat", "2 weitere Mandate", "3 oder mehr Mandate", "Zurzeit ausgelastet"];
export const VISIBILITY_LABEL = {
  public: "Öffentlich: Name und Profil für alle sichtbar",
  members: "Nur für angemeldete Personen: Name erst nach Anmeldung sichtbar",
  anonymous: "Anonym: Name und LinkedIn bleiben verborgen, Kontakt über SwissOwners",
} as const;

/** Kommaliste ↔ Array */
export const splitList = (s: string | null | undefined): string[] => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
export const joinList = (a: string[]): string => a.map((x) => x.trim().replace(/,/g, " ")).filter(Boolean).join(", ");
