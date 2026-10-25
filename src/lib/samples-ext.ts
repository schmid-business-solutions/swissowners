/* Mustereinträge für Partner, VR-Profile und VR-Mandate. Alle Namen und Angaben sind erfunden und
   überall als Muster gekennzeichnet. Namen enthalten «Muster», «Beispiel» o. ä., damit keine echte Firma
   oder Person gemeint sein kann. */

export const SAMPLE_ORGS = [
  {
    slug: "aare-ma-partner-muster", kind: "ma", name: "Aare M&A Partner (Muster)", city: "Bern", kanton: "Bern",
    tagline: "Verkauf und Kauf von KMU mit Firmenwert zwischen CHF 2 und 40 Millionen",
    description: "Wir begleiten Inhaberinnen und Inhaber beim Verkauf ihrer Firma – von der Bewertung über die Käufersuche bis zur Unterzeichnung. Unser Team aus fünf Partnern kennt den Berner Mittelstand aus eigener Unternehmererfahrung.\n\nAuf SwissOwners inserieren wir ausgewählte Mandate im Auftrag unserer Kunden. Anfragen behandeln wir vertraulich und beantworten sie innert zwei Werktagen.",
    services: "Unternehmensverkauf, Unternehmenskauf, Unternehmensbewertung, Due Diligence", branchen: "Industrie und Produktion, Handwerk und Gewerbe, Bau und Immobilien",
    focus: "Firmenwert CHF 2–40 Mio.", languages: "Deutsch, Französisch, Englisch", verified: true,
  },
  {
    slug: "nachfolge-netzwerk-ost-muster", kind: "nachfolge", name: "Nachfolge Netzwerk Ost (Muster)", city: "St. Gallen", kanton: "St. Gallen",
    tagline: "Nachfolgeberatung für Familienunternehmen in der Ostschweiz",
    description: "Rund die Hälfte unserer Mandate betrifft Gewerbebetriebe mit 5 bis 50 Mitarbeitenden. Wir moderieren die Nachfolge in der Familie, bereiten das Management-Buy-out vor oder suchen eine externe Nachfolge.\n\nUnsere Begleitung beginnt oft drei bis fünf Jahre vor der Übergabe – mit einer ehrlichen Standortbestimmung.",
    services: "Nachfolgeregelung, Unternehmensverkauf, Unternehmensbewertung, Steuern", branchen: "",
    focus: "Gewerbe und KMU bis 100 Mitarbeitende", languages: "Deutsch", verified: true,
  },
  {
    slug: "treuhand-muster-partner", kind: "treuhand", name: "Treuhand Muster & Partner", city: "Luzern", kanton: "Luzern",
    tagline: "Treuhand, Steuern und Nachfolge für KMU in der Zentralschweiz",
    description: "Seit über 30 Jahren betreuen wir Buchhaltung, Steuern und Revision für rund 400 KMU. Wenn unsere Kundinnen und Kunden eine Nachfolge suchen oder Kapital aufnehmen möchten, inserieren wir auf SwissOwners in ihrem Auftrag und begleiten den Prozess bis zur Übertragung der Anteile.",
    services: "Nachfolgeregelung, Steuern, Unternehmensbewertung, Recht und Verträge", branchen: "",
    focus: "KMU mit Umsatz bis CHF 25 Mio.", languages: "Deutsch, Englisch", verified: true,
  },
  {
    slug: "valoris-bewertung-muster", kind: "bewertung", name: "Valoris Bewertung (Muster)", city: "Zürich", kanton: "Zürich",
    tagline: "Unabhängige Unternehmensbewertungen für Verkauf, Nachfolge und Erbteilung",
    description: "Wir erstellen nachvollziehbare Bewertungen nach anerkannten Methoden – für Verkäufer, Käufer, Erbengemeinschaften und Verwaltungsräte. Auf Wunsch begleiten wir die Preisverhandlung als neutrale Fachstelle.",
    services: "Unternehmensbewertung, Due Diligence, Unternehmensverkauf", branchen: "Software und IT, Gesundheit und Life Sciences, Unternehmensdienstleistungen",
    focus: null, languages: "Deutsch, Englisch", verified: false,
  },
  {
    slug: "startup-foerderung-musterhausen", kind: "foerderung", name: "Startup-Förderung Region Musterhausen", city: "Thun", kanton: "Bern",
    tagline: "Kostenlose Beratung und Netzwerk für Gründerinnen und Gründer in der Region",
    description: "Als öffentliche Fachstelle unterstützen wir Startups mit Coaching, Kontakten zu Investoren und Hinweisen auf Fördergelder. Auf SwissOwners machen wir Finanzierungsrunden von Startups aus unserem Programm sichtbar.\n\nUnsere Angebote sind für Startups kostenlos.",
    services: "Coaching und Programme, Kapitalsuche und Finanzierung, Netzwerk und Events", branchen: "",
    focus: "Pre-Seed und Seed, Startups aus der Region", languages: "Deutsch, Französisch", verified: true,
  },
  {
    slug: "innovationspark-muster", kind: "park", name: "Innovationspark Muster", city: "Lausanne", kanton: "Waadt",
    tagline: "Büros, Labor und Netzwerk für Deeptech- und Medtech-Startups",
    description: "Über 60 Startups arbeiten bei uns auf dem Campus. Wir verbinden sie mit Hochschulen, Industriepartnern und Investoren und organisieren jedes Quartal einen Investorentag.",
    services: "Büros und Infrastruktur, Netzwerk und Events, Coaching und Programme", branchen: "Gesundheit und Life Sciences, Industrie und Produktion, Energie und Umwelt",
    focus: "Deeptech, Medtech, Cleantech", languages: "Französisch, Englisch, Deutsch", verified: true,
  },
  {
    slug: "muster-accelerator", kind: "inkubator", name: "Muster Accelerator", city: "Zürich", kanton: "Zürich",
    tagline: "Zwölfwöchiges Programm für Software-Startups bis zur Seed-Runde",
    description: "Zweimal im Jahr nehmen wir zehn Software-Startups in unser Programm auf: Mentoring durch erfahrene Gründer, Vertriebstraining und ein Demo Day mit über 80 Investoren. Nach dem Programm begleiten wir die Teams bei ihrer Finanzierungsrunde.",
    services: "Coaching und Programme, Kapitalsuche und Finanzierung, Netzwerk und Events", branchen: "Software und IT",
    focus: "Pre-Seed bis Seed, B2B-Software", languages: "Englisch, Deutsch", verified: true,
  },
  {
    slug: "alpine-seed-capital-muster", kind: "vc", name: "Alpine Seed Capital (Muster)", city: "Zug", kanton: "Zug",
    tagline: "Frühphasen-Fonds für Schweizer Tech-Startups, Tickets von CHF 250'000 bis 2 Mio.",
    description: "Wir investieren in Gründerteams aus der Schweiz, die Software, Fintech oder Industrie-Tech aufbauen. Neben Kapital bringen wir ein Netzwerk aus Unternehmern ein und übernehmen auf Wunsch einen Sitz im Verwaltungsrat.",
    services: "Investitionen, Kapitalsuche und Finanzierung, Netzwerk und Events", branchen: "Software und IT, Industrie und Produktion",
    focus: "Seed bis Series A, CHF 250'000–2 Mio.", languages: "Deutsch, Englisch", verified: true,
  },
  {
    slug: "business-angels-muster", kind: "angels", name: "Business Angels Muster", city: "Basel", kanton: "Basel-Stadt",
    tagline: "Rund 70 Privatinvestorinnen und -investoren mit Erfahrung in Life Sciences und Industrie",
    description: "Monatlich stellen sich bei uns drei bis vier Startups vor. Unsere Mitglieder investieren einzeln oder gemeinsam, typischerweise CHF 25'000 bis 150'000 pro Person, und begleiten die Firmen aktiv.",
    services: "Investitionen, Netzwerk und Events", branchen: "Gesundheit und Life Sciences, Industrie und Produktion",
    focus: "Pre-Seed und Seed", languages: "Deutsch, Englisch", verified: false,
  },
] as const;

/* Verknüpfung bestehender Musterangebote mit Musterpartnern (Titel → Partner) */
export const SAMPLE_LISTING_ORG: [string, string][] = [
  ["Schreinerei mit 18 Mitarbeitenden, Nachfolge-Teilverkauf", "nachfolge-netzwerk-ost-muster"],
  ["Elektroinstallationsfirma, alle Aktien zur Nachfolge", "aare-ma-partner-muster"],
  ["Präzisionsmechanik, Familienaktien", "aare-ma-partner-muster"],
  ["Treuhandbüro mit 220 Mandaten, Mehrheitsübernahme", "treuhand-muster-partner"],
  ["SaaS für Treuhandbüros, Seed-Runde", "muster-accelerator"],
  ["Foodtech-Startup, Pflanzenprotein aus Schweizer Erbsen", "startup-foerderung-musterhausen"],
  ["Biotech-Startup, Seed-Runde für Wirkstoffentwicklung", "business-angels-muster"],
];

export const SAMPLE_PROFILES = [
  {
    displayName: "Andrea Muster", headline: "Finanzexpertin, ehemalige CFO eines Industrie-KMU mit 250 Mitarbeitenden",
    bio: "Ich bringe 20 Jahre Erfahrung in Finanzen, Controlling und Finanzierung mit, davon zwölf Jahre als CFO. Im Verwaltungsrat achte ich auf eine solide Planung, klare Zahlen und eine vorausschauende Finanzierung. Ich suche ein Mandat in einem produzierenden KMU, gerne in einer Nachfolgesituation.",
    experience: "Betriebsökonomin FH, eidg. dipl. Expertin in Rechnungslegung und Controlling.\nCFO eines Maschinenbau-KMU (12 Jahre), zuvor Leiterin Controlling in einem Industriekonzern.\nVR-Lehrgang an einer Fachhochschule.",
    mandates: "VR-Mitglied, Holzbau-KMU (Kanton Bern)\nStiftungsrätin, Personalvorsorgestiftung", skills: "Finanzen und Controlling, Risikomanagement, Nachfolge und M&A",
    branchen: "Industrie und Produktion, Bau und Immobilien", languages: "Deutsch, Englisch", kanton: "Bern", capacity: "2 weitere Mandate",
    fee: "ab CHF 15'000 pro Jahr", investor: false, ticket: null, visibility: "public",
  },
  {
    displayName: "Reto Beispiel", headline: "Digitalisierungsexperte und Seriengründer, Business Angel",
    bio: "Ich habe zwei Software-Firmen gegründet und verkauft. Heute unterstütze ich KMU und Startups dabei, digitale Geschäftsmodelle aufzubauen. Bei Startups beteilige ich mich gerne auch finanziell und bringe mein Netzwerk zu Investoren ein.",
    experience: "Informatiker ETH, Executive MBA.\nGründer und CEO zweier Software-Firmen (verkauft 2015 und 2022).\nMentor in einem Accelerator-Programm.",
    mandates: "VR-Präsident, Software-Startup (Zürich)\nBeirat, Familienunternehmen im Detailhandel", skills: "Digitalisierung und IT, Startups und Innovation, Strategie, Marketing und Vertrieb",
    branchen: "Software und IT, Handel", languages: "Deutsch, Englisch", kanton: "Zürich", capacity: "1 weiteres Mandat",
    fee: "nach Vereinbarung", investor: true, ticket: "CHF 50'000–200'000", visibility: "members",
  },
  {
    displayName: "Sophie Modèle", headline: "Juristin mit Schwerpunkt Gesellschaftsrecht und Compliance",
    bio: "Als Anwältin begleite ich seit 15 Jahren Unternehmen in Fragen des Gesellschafts- und Vertragsrechts. Im Verwaltungsrat sorge ich für saubere Prozesse, eine gute Governance und rechtliche Sicherheit bei Wachstum, Finanzierungsrunden und Nachfolge.",
    experience: "Lic. iur., Anwaltspatent.\nPartnerin einer Wirtschaftskanzlei in der Romandie.\nDozentin für Gesellschaftsrecht.",
    mandates: "VR-Mitglied, Medtech-Startup (Waadt)", skills: "Recht und Compliance, Nachfolge und M&A, Risikomanagement",
    branchen: "Gesundheit und Life Sciences, Unternehmensdienstleistungen", languages: "Französisch, Deutsch, Englisch", kanton: "Waadt", capacity: "2 weitere Mandate",
    fee: "CHF 12'000–20'000 pro Jahr", investor: false, ticket: null, visibility: "public",
  },
  {
    displayName: "Marco Esempio", headline: "Hotelier und Tourismusexperte, ehemaliger Direktor eines Ferienresorts",
    bio: "Ich kenne Hotellerie und Bergbahnen aus der Praxis – vom Betrieb bis zur Finanzierung von Investitionen. Ich suche ein Mandat in einem Tourismusbetrieb, der seine Strategie schärfen oder eine Nachfolge vorbereiten möchte.",
    experience: "Hotelfachschule, Weiterbildung in Unternehmensführung.\n15 Jahre Direktor eines Ferienresorts mit 180 Mitarbeitenden.\nPräsident eines regionalen Tourismusverbands.",
    mandates: "VR-Mitglied, Bergbahn (Graubünden)", skills: "Strategie, Personal und Führung, Marketing und Vertrieb",
    branchen: "Tourismus und Freizeit, Gastronomie und Lebensmittel", languages: "Italienisch, Deutsch, Englisch", kanton: "Tessin", capacity: "1 weiteres Mandat",
    fee: null, investor: true, ticket: "CHF 25'000–100'000", visibility: "public",
  },
  {
    displayName: "Daniel Muster-Keller", headline: "Unternehmer mit Erfahrung in Nachfolge, Produktion und Export",
    bio: "Ich habe das Familienunternehmen in dritter Generation geführt und an ein Management-Team übergeben. Diese Erfahrung möchte ich als Verwaltungsrat weitergeben – besonders an Firmen, die vor einer Nachfolge oder einem Exportschritt stehen.",
    experience: "Maschineningenieur, Executive MBA.\n18 Jahre CEO eines Präzisionsteile-Herstellers mit Export in 20 Länder.\nVorstand eines kantonalen Industrieverbands.",
    mandates: null, skills: "Nachfolge und M&A, Internationalisierung, Produktion und Operations, Strategie",
    branchen: "Industrie und Produktion", languages: "Deutsch, Englisch, Französisch", kanton: "Solothurn", capacity: "3 oder mehr Mandate",
    fee: "ab CHF 10'000 pro Jahr", investor: true, ticket: "CHF 100'000–500'000", visibility: "anonymous",
  },
  {
    displayName: "Nadia Beispiel", headline: "Nachhaltigkeits- und ESG-Expertin, Verwaltungsrätin in zwei KMU",
    bio: "Ich unterstütze Verwaltungsräte dabei, Nachhaltigkeit in Strategie und Berichterstattung zu verankern – pragmatisch und passend zur Grösse des Unternehmens. Mein Hintergrund ist die Energiebranche.",
    experience: "Umweltnaturwissenschaften ETH, CAS Verwaltungsrat.\nLeiterin Nachhaltigkeit bei einem Energieversorger.\nBeraterin für ESG-Berichterstattung.",
    mandates: "VR-Mitglied, Solar-KMU (Aargau)\nVR-Mitglied, Recycling-Firma (Zürich)", skills: "Nachhaltigkeit und ESG, Strategie, Risikomanagement",
    branchen: "Energie und Umwelt, Bau und Immobilien", languages: "Deutsch, Englisch", kanton: "Aargau", capacity: "1 weiteres Mandat",
    fee: "nach Vereinbarung", investor: false, ticket: null, visibility: "members",
  },
] as const;

export const SAMPLE_MANDATES = [
  {
    role: "mitglied", title: "VR-Mitglied mit Finanzerfahrung für Familien-KMU im Metallbau", segment: "kmu", branche: "Handwerk und Gewerbe", kanton: "Bern",
    revenueClass: "CHF 5–10 Mio.", employees: 42, phase: null, skills: "Finanzen und Controlling, Nachfolge und M&A",
    description: "Die Familie hält alle Aktien und plant in fünf Jahren die Nachfolge. Der Verwaltungsrat besteht heute aus dem Inhaber und seiner Frau. Gesucht ist eine unabhängige Person, die Finanzen, Planung und die Vorbereitung der Nachfolge begleitet.",
    effort: "5 Sitzungen und rund 8 Tage pro Jahr", fee: "CHF 10'000–15'000 pro Jahr", requirements: "Erfahrung als CFO oder Finanzchef in einem KMU, Wohnsitz in der Schweiz",
    languages: "Deutsch", startAt: "Generalversammlung Mai 2027", investWelcome: false, org: "aare-ma-partner-muster", daysAgo: 3,
  },
  {
    role: "praesidium", title: "VR-Präsidium für wachsendes Medtech-Startup nach der Series-A-Runde", segment: "startup", branche: "Gesundheit und Life Sciences", kanton: "Waadt",
    revenueClass: "CHF 1–2 Mio.", employees: 24, phase: "Series A", skills: "Strategie, Startups und Innovation, Internationalisierung",
    description: "Nach der Series-A-Runde soll das Präsidium von einer unabhängigen Person mit Erfahrung im Aufbau internationaler Medtech-Firmen übernommen werden. Der Verwaltungsrat hat fünf Mitglieder, darunter zwei Investorenvertreter.",
    effort: "8 Sitzungen und rund 20 Tage pro Jahr", fee: "CHF 30'000–40'000 pro Jahr plus Optionen", requirements: "Erfahrung in einer Geschäftsleitung oder einem VR im Medtech-Bereich, Englisch verhandlungssicher",
    languages: "Französisch, Englisch", startAt: "ab Januar 2027", investWelcome: true, org: "innovationspark-muster", daysAgo: 5,
  },
  {
    role: "beirat", title: "Beirat Digitalisierung für Bäckerei-Confiserie mit acht Filialen", segment: "kmu", branche: "Gastronomie und Lebensmittel", kanton: "Luzern",
    revenueClass: "CHF 5–10 Mio.", employees: 85, phase: null, skills: "Digitalisierung und IT, Marketing und Vertrieb",
    description: "Wir möchten Onlineshop, Kundenbindung und Produktionsplanung digitalisieren und suchen dafür eine erfahrene Person für unseren Beirat. Der Beirat trifft sich viermal im Jahr mit der Geschäftsleitung.",
    effort: "4 Sitzungen pro Jahr", fee: "CHF 1'500 pro Sitzung", requirements: null,
    languages: "Deutsch", startAt: "sofort", investWelcome: false, org: "treuhand-muster-partner", daysAgo: 8,
  },
  {
    role: "mitglied", title: "VR-Mitglied mit Rechtserfahrung für Software-Startup", segment: "startup", branche: "Software und IT", kanton: "Zürich",
    revenueClass: "CHF 0,5–1 Mio.", employees: 11, phase: "Seed", skills: "Recht und Compliance, Startups und Innovation",
    description: "Nach unserer Seed-Runde erweitern wir den Verwaltungsrat. Gesucht ist eine Person mit juristischem Hintergrund, die uns bei Verträgen mit Grosskunden, Datenschutz und der nächsten Finanzierungsrunde unterstützt.",
    effort: "6 Sitzungen und rund 10 Tage pro Jahr", fee: "Optionen nach Vereinbarung", requirements: "Erfahrung mit Startups und Finanzierungsrunden",
    languages: "Deutsch, Englisch", startAt: "ab Februar 2027", investWelcome: true, org: "muster-accelerator", daysAgo: 12,
  },
  {
    role: "mitglied", title: "VR-Mitglied mit Erfahrung in Hotellerie für Familienhotel", segment: "kmu", branche: "Tourismus und Freizeit", kanton: "Graubünden",
    revenueClass: "CHF 2–5 Mio.", employees: 30, phase: null, skills: "Strategie, Personal und Führung",
    description: "Das Hotel mit 45 Zimmern ist seit drei Generationen in Familienbesitz. Der Verwaltungsrat möchte sich mit einer externen Person aus der Hotellerie verstärken, die bei der Neuausrichtung und einer anstehenden Renovation mitdenkt.",
    effort: "4 Sitzungen und rund 6 Tage pro Jahr", fee: "CHF 8'000 pro Jahr", requirements: "Praxiserfahrung in der Hotellerie",
    languages: "Deutsch, Italienisch", startAt: "Generalversammlung Juni 2027", investWelcome: true, org: null, daysAgo: 15,
  },
] as const;
