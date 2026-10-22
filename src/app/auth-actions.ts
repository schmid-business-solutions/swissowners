"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import {
  consumeAuthToken, createAuthToken, createSession, destroySession, getUser, hashPassword, isAdminEmail, verifyPassword,
} from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { allow, clientIp } from "@/lib/rate-limit";
import { appUrl } from "@/lib/format";

export type FormState = { error?: string; ok?: string } | undefined;

const safeNext = (n: FormDataEntryValue | null) => {
  const s = String(n ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/konto";
};

const pw = z.string().min(10, "Passwort: mindestens 10 Zeichen").max(200);

async function sendVerification(userId: number, email: string, firstName: string) {
  const token = await createAuthToken(userId, "verify");
  await sendMail({
    to: email,
    subject: "Bitte bestätigen Sie Ihre E-Mail-Adresse",
    heading: `Willkommen bei SwissOwners, ${firstName}`,
    paragraphs: ["Bitte bestätigen Sie Ihre E-Mail-Adresse. Der Link ist 72 Stunden gültig.", "Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail."],
    cta: { label: "E-Mail bestätigen", url: `${appUrl()}/bestaetigen?token=${token}` },
  });
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!allow(`reg:${ip}`, 5, 3_600_000)) return { error: "Zu viele Versuche. Bitte später erneut versuchen." };
  const parsed = z.object({
    firstName: z.string().trim().min(1, "Vorname fehlt").max(100),
    lastName: z.string().trim().min(1, "Nachname fehlt").max(100),
    email: z.string().trim().toLowerCase().email("E-Mail-Adresse prüfen").max(255),
    password: pw,
    agb: z.literal("on", { message: "Bitte AGB und Datenschutzerklärung akzeptieren" }),
  }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, d.email)).limit(1);
  if (exists) return { error: "Zu dieser E-Mail-Adresse besteht bereits ein Konto. Bitte melden Sie sich an." };
  const [ins] = await db.insert(schema.users).values({
    email: d.email, passwordHash: await hashPassword(d.password), firstName: d.firstName, lastName: d.lastName,
    role: isAdminEmail(d.email) ? "admin" : "user",
  }).$returningId();
  await sendVerification(ins.id, d.email, d.firstName);
  await createSession(ins.id);
  redirect(`/bestaetigen?next=${encodeURIComponent(safeNext(fd.get("next")))}&neu=1`);
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();
  if (!allow(`login:${ip}`, 20, 900_000) || !allow(`login:${email}`, 8, 900_000)) {
    return { error: "Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen." };
  }
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u || !(await verifyPassword(password, u.passwordHash))) return { error: "E-Mail oder Passwort ist falsch." };
  if (u.role !== "admin" && isAdminEmail(u.email)) {
    await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, u.id));
  }
  await createSession(u.id);
  redirect(safeNext(fd.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function resendVerification(_: FormState): Promise<FormState> {
  const u = await getUser();
  if (!u) redirect("/login");
  if (u.emailVerifiedAt) return { ok: "Ihre E-Mail-Adresse ist bereits bestätigt." };
  if (!allow(`verify:${u.id}`, 3, 3_600_000)) return { error: "Bitte warten Sie etwas, bevor Sie eine weitere E-Mail anfordern." };
  await sendVerification(u.id, u.email, u.firstName);
  return { ok: `Wir haben eine neue E-Mail an ${u.email} gesendet.` };
}

export async function requestReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const ip = await clientIp();
  const okMsg = { ok: "Falls ein Konto zu dieser Adresse besteht, haben wir Ihnen einen Link zum Zurücksetzen gesendet." };
  if (!allow(`reset:${ip}`, 5, 3_600_000)) return okMsg;
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (u) {
    const token = await createAuthToken(u.id, "reset");
    await sendMail({
      to: u.email,
      subject: "Passwort zurücksetzen",
      heading: "Neues Passwort festlegen",
      paragraphs: ["Über den folgenden Link legen Sie ein neues Passwort fest. Er ist 2 Stunden gültig.", "Falls Sie das nicht angefordert haben, ignorieren Sie diese E-Mail."],
      cta: { label: "Neues Passwort festlegen", url: `${appUrl()}/passwort-neu?token=${token}` },
    });
  }
  return okMsg;
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const p = pw.safeParse(fd.get("password"));
  if (!p.success) return { error: p.error.issues[0].message };
  const userId = await consumeAuthToken(String(fd.get("token") ?? ""), "reset");
  if (!userId) return { error: "Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an." };
  await db.update(schema.users).set({ passwordHash: await hashPassword(p.data), emailVerifiedAt: new Date() }).where(eq(schema.users.id, userId));
  await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  await createSession(userId);
  redirect("/konto?ok=passwort");
}
