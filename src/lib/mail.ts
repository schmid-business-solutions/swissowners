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

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Schlichtes E-Mail-Layout im SwissOwners-Stil. paragraphs: Text-Absätze (werden escaped). */
function layout(heading: string, paragraphs: string[], cta?: { label: string; url: string }) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.5">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const button = cta
    ? `<p style="margin:22px 0"><a href="${esc(cta.url)}" style="background:#D8000F;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:4px;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F4F4F2;font-family:Helvetica,Arial,sans-serif;color:#1B1B1B">
<div style="max-width:560px;margin:0 auto;background:#fff;border-top:4px solid #D8000F">
<div style="padding:20px 26px;border-bottom:1px solid #DCDCD8;font-weight:800;font-size:20px">Swiss<span style="color:#D8000F">Owners</span></div>
<div style="padding:26px"><h1 style="font-size:20px;margin:0 0 16px">${esc(heading)}</h1>${body}${button}</div>
<div style="padding:16px 26px;background:#1B1B1B;color:#B8B8B3;font-size:12px">SCHMID Business Solutions, Steffisburg · UID CHE-199.237.91<br><a href="${appUrl()}" style="color:#fff">${appUrl().replace(/^https?:\/\//, "")}</a></div>
</div></body></html>`;
}

export async function sendMail(opts: {
  to: string; subject: string; heading: string; paragraphs: string[];
  cta?: { label: string; url: string }; replyTo?: string;
}) {
  const text = [opts.heading, "", ...opts.paragraphs, ...(opts.cta ? ["", `${opts.cta.label}: ${opts.cta.url}`] : [])].join("\n\n");
  const t = getTransport();
  if (!t) {
    console.log(`[mail:dev] An ${opts.to} · ${opts.subject}\n${text}\n`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      text,
      html: layout(opts.heading, opts.paragraphs, opts.cta),
    });
  } catch (err) {
    console.error("[mail] Versand fehlgeschlagen", opts.to, opts.subject, err);
  }
}

export async function notifyAdmin(subject: string, paragraphs: string[], url?: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to || !envSet("ADMIN_NOTIFY_EMAIL")) return;
  await sendMail({ to, subject: `[SwissOwners] ${subject}`, heading: subject, paragraphs, cta: url ? { label: "Öffnen", url } : undefined });
}
