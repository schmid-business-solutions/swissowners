"use server";
import { db, schema } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { sendMail, type Fact } from "@/lib/mail";
import { allow, clientIp } from "@/lib/rate-limit";
import { appUrl } from "@/lib/format";
import { contactNo, mergeTopics, parseTopics } from "@/lib/contact";

export type ContactState = { error?: string; ok?: boolean; no?: string; email?: string } | undefined;

const str = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function sendContact(_: ContactState, fd: FormData): Promise<ContactState> {
  // Spam-Schutz: verstecktes Feld und Mindestzeit zum Ausfüllen – Bots erhalten eine Scheinbestätigung
  if (str(fd, "fax", 100)) return { ok: true, no: "", email: "" };
  const started = Number(fd.get("t") ?? 0);
  if (started && Date.now() - started < 3000) return { ok: true, no: "", email: "" };

  const topics = parseTopics(fd.getAll("topic").map(String));
  if (!topics.length) return { error: "Bitte wählen Sie mindestens ein Thema." };
  const m = mergeTopics(topics);
  const topicLabel = m.label;
  const name = str(fd, "name", 160);
  const email = str(fd, "email", 255).toLowerCase();
  const phone = str(fd, "phone", 40);
  const company = str(fd, "company", 160);
  const message = String(fd.get("message") ?? "").trim();
  let subject = str(fd, "subject", 200);

  if (name.length < 2) return { error: "Bitte geben Sie Ihren Namen an." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Bitte prüfen Sie Ihre E-Mail-Adresse." };
  if (m.companyRequired && company.length < 2) return { error: "Bitte geben Sie Ihre Firma bzw. Ihr Medium an." };
  if (message.length < 20) return { error: "Bitte schreiben Sie mindestens 20 Zeichen." };
  if (message.length > 5000) return { error: "Die Nachricht ist zu lang (höchstens 5000 Zeichen)." };
  if (fd.get("privacy") !== "on") return { error: "Bitte bestätigen Sie den Hinweis zum Datenschutz." };

  const details: Record<string, string> = {};
  const facts: Fact[] = [];
  for (const f of m.extra) {
    const v = str(fd, `x_${f.name}`, 300);
    if (f.required && !v) return { error: `Bitte füllen Sie «${f.label}» aus.` };
    if (f.options && v && !f.options.includes(v)) return { error: `Bitte wählen Sie bei «${f.label}» eine Option.` };
    if (f.type === "rating" && v && !/^[1-5]$/.test(v)) return { error: "Bitte wählen Sie 1 bis 5 Sterne." };
    if (v) {
      details[f.label] = f.type === "rating" ? `${v} von 5` : v;
      facts.push([f.label, details[f.label]]);
    }
  }
  if (!subject) subject = topicLabel;

  const ip = await clientIp();
  if (!allow(`contact:${ip}`, 6, 3_600_000) || !allow(`contact:${email}`, 10, 86_400_000)) {
    return { error: "Sie haben bereits mehrere Nachrichten gesendet. Bitte versuchen Sie es später erneut." };
  }

  const user = await getUser().catch(() => null);
  // Speichern; falls die Datenbank klemmt, geht die Nachricht trotzdem per E-Mail raus
  let no = "";
  try {
    const [ins] = await db.insert(schema.contactMessages).values({
    topic: topics.map((t) => t.id).join(","), name, email, phone: phone || null, company: company || null, subject, message,
    details: Object.keys(details).length ? JSON.stringify(details) : null,
    userId: user?.id ?? null, ip,
  }).$returningId();
    no = contactNo(ins.id);
  } catch (err) {
    console.error("[kontakt] Speichern fehlgeschlagen", err);
  }

  const head = `Kontakt${no ? ` ${no}` : ""}: ${topicLabel}`;
  await sendMail({
    to: process.env.ADMIN_NOTIFY_EMAIL || "office@schmidbusiness.com",
    subject: head, heading: head,
    paragraphs: [`Betreff: ${subject}`, `Nachricht:\n${message}`],
    cta: { label: "Alle Kontaktanfragen", url: `${appUrl()}/admin/kontakt` },
    replyTo: email,
    facts: [
      [topics.length > 1 ? "Themen" : "Thema", topicLabel], ["Name", name], ["E-Mail", email],
      ...(phone ? [["Telefon", phone] as Fact] : []), ...(company ? [["Firma", company] as Fact] : []),
      ...facts, ["Konto", user ? `Ja (${user.email})` : "Nicht angemeldet"],
    ],
    after: ["Antworten Sie direkt auf diese E-Mail."],
  });

  await sendMail({
    to: email, subject: `Ihre Nachricht${no ? ` ${no}` : ""} ist angekommen`,
    heading: "Danke für Ihre Nachricht",
    paragraphs: [
      `Guten Tag ${name}`,
      `Wir haben Ihre Nachricht zu «${topics.map((t) => t.label).join("», «")}» erhalten. Ein Mensch aus unserem Team liest sie und antwortet Ihnen in der Regel innerhalb von 1 bis 2 Werktagen.`,
      ...(no ? [`Ihre Referenz: ${no}`] : []),
      `Ihre Nachricht:\n${message}`,
    ],
    cta: { label: "Zu SwissOwners", url: appUrl() },
  });

  return { ok: true, no, email };
}
