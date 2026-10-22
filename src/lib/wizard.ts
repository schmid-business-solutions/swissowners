/* Gemeinsame Typen und Vorgaben für das Angebot-Formular (Server und Client) */
export type WizardData = {
  type: "sell" | "cap"; segment: "kmu" | "startup";
  branche: string; sub: string; kanton: string; legalForm: string; revenueClass: string;
  employees: string; foundedYear: string; phase: string; shareClass: string;
  companyName: string; companyUid: string; companyInformed: boolean;
  title: string; stake: string; amount: string; valuation: string; minTicket: string;
  vinkuliert: "ja" | "nein" | "unklar"; vorkauf: "ja" | "nein" | "unklar";
  description: string; reason: string;
  plan: "start" | "basis" | "plus" | "premium"; agb: boolean;
};

export type PlanInfo = { id: "basis" | "plus" | "premium"; name: string; first: number; renewal: number; text: string };
export type SubmitResult = { error?: string; field?: string } | undefined;

export const emptyWizard = (type: "sell" | "cap" = "sell"): WizardData => ({
  type, segment: "kmu", branche: "", sub: "", kanton: "", legalForm: "AG", revenueClass: "",
  employees: "", foundedYear: "", phase: "", shareClass: "unklar",
  companyName: "", companyUid: "", companyInformed: false,
  title: "", stake: "", amount: "", valuation: "", minTicket: "",
  vinkuliert: "unklar", vorkauf: "unklar", description: "", reason: "",
  plan: "start", agb: false,
});

