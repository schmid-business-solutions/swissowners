/* Preismodell: Startangebot, danach drei Pakete.
   Erste Laufzeit 60 Tage, danach automatische Verlängerung um je 30 Tage bis Kündigung oder Pause.
   Preise in CHF (keine MWST). Hier zentral anpassen. */

export type PaidPlan = "basis" | "plus" | "premium";
export type Plan = "start" | PaidPlan;

export const FIRST_PERIOD_DAYS = 60;
export const RENEWAL_DAYS = 30;
export const MAX_PAUSE_DAYS = 90;
export const REMIND_START_DAYS = 7; // Erinnerung vor Ablauf Startangebot
export const REMIND_RENEWAL_DAYS = 5; // Erinnerung vor automatischer Verlängerung
export const VAT_RATE = 0.081;

export const PLANS: Record<PaidPlan, { name: string; first: number; renewal: number; text: string }> = {
  basis: { name: "Basis", first: 149, renewal: 49, text: "Angebot online, Anfragen mit digitaler Vertraulichkeitserklärung" },
  plus: { name: "Plus", first: 249, renewal: 79, text: "Zusätzlich hervorgehoben in der Suche" },
  premium: { name: "Premium", first: 449, renewal: 149, text: "Zusätzlich Top-Angebot auf der Startseite" },
};

export const PAID_PLANS = Object.keys(PLANS) as PaidPlan[];

export function planName(p: Plan): string {
  return p === "start" ? "Startangebot" : PLANS[p].name;
}

/** Rang für die Sortierung «Relevanz»: Premium vor Plus/Start vor Basis */
export function planRank(p: Plan): number {
  return p === "premium" ? 3 : p === "plus" || p === "start" ? 2 : 1;
}

export function startOffer() {
  const slots = Number(process.env.START_FREE_SLOTS ?? 50);
  const untilStr = process.env.START_FREE_UNTIL ?? "2027-01-31";
  const until = new Date(untilStr + "T23:59:59+01:00");
  return { slots, until, untilStr };
}

export function vatPart(totalChf: number): number {
  return Math.round((totalChf / (1 + VAT_RATE)) * VAT_RATE * 20) / 20;
}

/* Preise für Verwaltungsräte und Partner (gemäss Konzept). Während der Beta kostenlos; Abrechnung folgt später.
   Rhythmus wie bei den Angeboten: erste Laufzeit 60 Tage, danach monatlich (jeweils 30 Tage). */
export const BETA_FREE_EXT = true;
export const EXT_PRODUCTS = {
  vrBasis: { name: "VR-Profil Basis", first: 0, renewal: 0, text: "Profil, Bewerbung auf Mandate, passende Mandate im Profil" },
  vrPremium: { name: "VR-Profil Premium", first: 29, renewal: 15, text: "Zusätzlich hervorgehoben in der Suche, Badge «Mandate geprüft» und Statistik" },
  vrMandat: { name: "VR-Mandat", first: 149, renewal: 49, text: "Mandat online, Firma anonym bis zur Vertraulichkeitsbestätigung, passende Verwaltungsräte" },
  partnerProfil: { name: "Partnerprofil", first: 0, renewal: 0, text: "Profil und Eintrag im Partnerverzeichnis; Inserate einzeln zum Normalpreis" },
  partnerStarter: { name: "Partner Starter", first: 249, renewal: 99, text: "Bis 3 aktive Inserate im Auftrag, Teamkonto, Übersicht aller Mandate, Sammelrechnung" },
  partnerPro: { name: "Partner Pro", first: 590, renewal: 249, text: "Bis 10 aktive Inserate im Auftrag, hervorgehoben im Verzeichnis, 2 Plus-Upgrades" },
  foerderung: { name: "Öffentliche Startup-Förderung", first: 0, renewal: 0, text: "Für Fachstellen von Gemeinden, Städten und Kantonen: Leistungen wie Partner Pro" },
} as const;
