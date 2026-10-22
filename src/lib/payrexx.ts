import "server-only";
import { createHmac } from "node:crypto";
import { envSet } from "./env";

/* Payrexx REST-API (https://developers.payrexx.com)
   Authentifizierung: ApiSignature = Base64(HMAC-SHA256(http_build_query(params), API-Secret)) */

type Params = Record<string, unknown>;

/** PHP urlencode(): wie encodeURIComponent, zusätzlich !'()*~ kodiert, Leerzeichen als + */
const phpEncode = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, "+");

/** Nachbau von PHPs http_build_query() inkl. verschachtelter Arrays/Objekte */
export function httpBuildQuery(params: Params, prefix?: string): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") {
      const obj = Array.isArray(v) ? Object.fromEntries(v.map((x, i) => [String(i), x])) : (v as Params);
      const nested = httpBuildQuery(obj, key);
      if (nested) parts.push(nested);
    } else {
      const val = typeof v === "boolean" ? (v ? "1" : "0") : String(v);
      parts.push(`${phpEncode(key)}=${phpEncode(val)}`);
    }
  }
  return parts.join("&");
}

export function sign(query: string, secret: string) {
  return createHmac("sha256", secret).update(query).digest("base64");
}

export const isConfigured = () => envSet("PAYREXX_INSTANCE", "PAYREXX_API_SECRET");

async function call<T>(method: "GET" | "POST" | "DELETE", path: string, params: Params = {}): Promise<T> {
  const instance = process.env.PAYREXX_INSTANCE;
  const secret = process.env.PAYREXX_API_SECRET;
  if (!instance || !secret || !isConfigured()) throw new Error("Payrexx ist nicht konfiguriert (PAYREXX_INSTANCE / PAYREXX_API_SECRET)");
  const base = (process.env.PAYREXX_API_BASE ?? "https://api.payrexx.com/v1.0").replace(/\/$/, "");
  const query = httpBuildQuery(params);
  const signed = (query ? query + "&" : "") + "ApiSignature=" + phpEncode(sign(query, secret));
  let url = `${base}/${path.replace(/^\//, "")}?instance=${encodeURIComponent(instance)}`;
  const init: RequestInit = { method, headers: { Accept: "application/json" }, cache: "no-store" };
  if (method === "POST") {
    init.body = signed;
    (init.headers as Record<string, string>)["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    url += "&" + signed;
  }
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: unknown } | null;
  if (!res.ok || !json || json.status !== "success") {
    throw new Error(`Payrexx ${method} ${path} fehlgeschlagen: ${res.status} ${json?.message ?? ""}`.trim());
  }
  return json.data as T;
}

export type PxTransaction = { id: number; status: string; amount?: number; referenceId?: string; preAuthorizationId?: number | null };
export type PxGateway = {
  id: number; status: string; hash: string; link: string; referenceId?: string;
  invoices?: { transactions?: PxTransaction[] }[];
};

export async function createGateway(opts: {
  amountRappen: number; purpose: string; referenceId: string;
  successUrl: string; failedUrl: string; cancelUrl: string;
  email?: string; firstName?: string; lastName?: string;
  tokenize: boolean;
}): Promise<PxGateway> {
  const params: Params = {
    amount: opts.amountRappen,
    currency: "CHF",
    vatRate: 8.1,
    purpose: opts.purpose,
    referenceId: opts.referenceId,
    successRedirectUrl: opts.successUrl,
    failedRedirectUrl: opts.failedUrl,
    cancelRedirectUrl: opts.cancelUrl,
    skipResultPage: 1,
    lookAndFeelProfile: process.env.PAYREXX_LOOK_AND_FEEL || undefined,
    fields: {
      email: opts.email ? { value: opts.email } : undefined,
      forename: opts.firstName ? { value: opts.firstName } : undefined,
      surname: opts.lastName ? { value: opts.lastName } : undefined,
    },
  };
  if (opts.tokenize) {
    // Zahlungsmittel für die automatische Verlängerung hinterlegen und sofort die erste Laufzeit belasten
    params.preAuthorization = 1;
    params.chargeOnAuthorization = 1;
  }
  const data = await call<PxGateway[]>("POST", "Gateway/", params);
  return data[0];
}

export async function getGateway(id: number): Promise<PxGateway> {
  const data = await call<PxGateway[]>("GET", `Gateway/${id}/`);
  return data[0];
}

export async function getTransaction(id: number): Promise<PxTransaction> {
  const data = await call<PxTransaction[]>("GET", `Transaction/${id}/`);
  return data[0];
}

/** Belastet eine hinterlegte (pre-authorized) Transaktion erneut – für die automatische Verlängerung */
export async function chargeToken(tokenTxId: number, amountRappen: number, purpose: string, referenceId: string): Promise<PxTransaction> {
  const data = await call<PxTransaction[]>("POST", `Transaction/${tokenTxId}/`, { amount: amountRappen, purpose, referenceId });
  return data[0];
}

const OK = new Set(["confirmed", "authorized"]);
/** Bewertet ein Gateway: bezahlt? und welche Transaktion dient als Token für spätere Belastungen */
export function evaluateGateway(g: PxGateway): { paid: boolean; tokenTxId: number | null; txId: number | null } {
  const txs = (g.invoices ?? []).flatMap((i) => i.transactions ?? []);
  const authorized = txs.find((t) => t.status === "authorized");
  const confirmed = txs.find((t) => t.status === "confirmed");
  const paid = OK.has(g.status) || Boolean(confirmed || authorized);
  return {
    paid,
    tokenTxId: authorized?.id ?? confirmed?.preAuthorizationId ?? confirmed?.id ?? null,
    txId: confirmed?.id ?? authorized?.id ?? null,
  };
}
