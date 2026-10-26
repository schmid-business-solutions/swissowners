import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { appUrl } from "./format";
import { envSet } from "./env";

let transport: Transporter | null = null;
function getTransport() {
  if (!envSet("SMTP_HOST", "SMTP_USER", "SMTP_PASS")) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

/** Absendername und Betreff-Präfix aller E-Mails */
const BRAND = "swissowners.ch";
const withBrand = (subject: string) => (subject.startsWith(BRAND) ? subject : `${BRAND} – ${subject}`);
/** Adresse aus MAIL_FROM («Name <adresse>» oder nur Adresse), sonst SMTP_USER */
function senderAddress(): string {
  const raw = process.env.MAIL_FROM ?? "";
  return raw.match(/<([^>]+)>/)?.[1] ?? (raw.includes("@") ? raw.trim() : process.env.SMTP_USER ?? "");
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Schlichtes E-Mail-Layout im SwissOwners-Stil. paragraphs: Text-Absätze (werden escaped). */
export type Fact = [label: string, value: string];

function factsTable(facts: Fact[]) {
  const rows = facts.map(([k, v]) => `<tr><td style="padding:7px 12px 7px 0;color:#66625A;font-size:13px;vertical-align:top;white-space:nowrap;border-bottom:1px solid #EEEBE5">${esc(k)}</td><td style="padding:7px 0;font-size:14px;vertical-align:top;border-bottom:1px solid #EEEBE5">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:4px 0 18px">${rows}</table>`;
}

function layout(heading: string, paragraphs: string[], cta?: { label: string; url: string }, facts?: Fact[], after?: string[]) {
  const para = (p: string) => `<p style="margin:0 0 14px;line-height:1.5">${esc(p).replace(/\n/g, "<br>")}</p>`;
  const button = cta
    ? `<p style="margin:22px 0"><a href="${esc(cta.url)}" style="background:#D9102B;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:4px;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  const body = paragraphs.map(para).join("") + (facts?.length ? button + factsTable(facts) : "") + (after ?? []).map(para).join("");
  return `<!doctype html><html><body style="margin:0;background:#F5F3EF;font-family:Helvetica,Arial,sans-serif;color:#33363A">
<div style="max-width:560px;margin:0 auto;background:#fff;border-top:4px solid #D9102B">
<div style="padding:20px 26px;border-bottom:1px solid #E1DDD5;font-weight:800;font-size:22px;color:#D9102B;letter-spacing:-0.5px">Swiss<span style="font-weight:600">Owners</span></div>
<div style="padding:26px"><h1 style="font-size:20px;margin:0 0 16px">${esc(heading)}</h1>${body}${button}</div>
<div style="padding:16px 26px;background:#33363A;color:#B8B8B3;font-size:12px">SCHMID Business Solutions<br><a href="${appUrl()}" style="color:#fff">${appUrl().replace(/^https?:\/\//, "")}</a></div>
</div></body></html>`;
}

export async function sendMail(opts: {
  to: string; subject: string; heading: string; paragraphs: string[];
  cta?: { label: string; url: string }; replyTo?: string;
  /** Optionale Tabelle mit Eckdaten (nach den Absätzen) und Absätze danach */
  facts?: Fact[]; after?: string[];
}) {
  const factText = opts.facts?.length ? [opts.facts.map(([k, v]) => `${k}: ${v}`).join("\n")] : [];
  const text = [opts.heading, "", ...opts.paragraphs, ...factText, ...(opts.after ?? []), ...(opts.cta ? ["", `${opts.cta.label}: ${opts.cta.url}`] : [])].join("\n\n");
  const t = getTransport();
  if (!t) {
    console.log(`[mail:dev] An ${opts.to} · ${withBrand(opts.subject)}\n${text}\n`);
    return;
  }
  try {
    await t.sendMail({
      from: { name: BRAND, address: senderAddress() },
      to: opts.to,
      replyTo: opts.replyTo,
      subject: withBrand(opts.subject),
      text,
      html: layout(opts.heading, opts.paragraphs, opts.cta, opts.facts, opts.after),
    });
  } catch (err) {
    console.error("[mail] Versand fehlgeschlagen", opts.to, opts.subject, err);
  }
}

export async function notifyAdmin(subject: string, paragraphs: string[], url?: string, extra?: { facts?: Fact[]; after?: string[]; ctaLabel?: string; replyTo?: string }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to || !envSet("ADMIN_NOTIFY_EMAIL")) return;
  await sendMail({
    to, subject, heading: subject, paragraphs,
    cta: url ? { label: extra?.ctaLabel ?? "Öffnen", url } : undefined,
    facts: extra?.facts, after: extra?.after, replyTo: extra?.replyTo,
  });
}
