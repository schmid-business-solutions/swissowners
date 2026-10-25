"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { review, type ReviewKind } from "@/lib/review";
import { createExtSamples } from "@/lib/samples-ext-admin";

const kindOf = (v: FormDataEntryValue | null): ReviewKind => (v === "org" || v === "profile" ? v : "mandate");
const back = (ok: string) => { revalidatePath("/partner"); revalidatePath("/verwaltungsraete"); revalidatePath("/admin/pruefung"); redirect(`/admin/pruefung?ok=${ok}`); };

export async function approveExtAction(fd: FormData) {
  await requireAdmin();
  await review(kindOf(fd.get("kind")), Number(fd.get("id")), true, "", fd.get("verified") === "on");
  back("freigeschaltet");
}

export async function rejectExtAction(fd: FormData) {
  await requireAdmin();
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 5) redirect("/admin/pruefung?err=grund");
  await review(kindOf(fd.get("kind")), Number(fd.get("id")), false, reason);
  back("abgelehnt");
}

export async function deleteExtSamplesAction(fd: FormData) {
  await requireAdmin();
  const k = kindOf(fd.get("kind"));
  if (k === "org") await db.delete(schema.orgs).where(eq(schema.orgs.isSample, true));
  if (k === "profile") await db.delete(schema.boardProfiles).where(eq(schema.boardProfiles.isSample, true));
  if (k === "mandate") await db.delete(schema.boardMandates).where(eq(schema.boardMandates.isSample, true));
  back("muster-geloescht");
}

export async function deleteExtSampleAction(fd: FormData) {
  await requireAdmin();
  const k = kindOf(fd.get("kind")), id = Number(fd.get("id"));
  const t = k === "org" ? schema.orgs : k === "profile" ? schema.boardProfiles : schema.boardMandates;
  const [row] = await db.select({ s: t.isSample }).from(t).where(eq(t.id, id)).limit(1);
  if (row?.s) await db.delete(t).where(eq(t.id, id));
  back("muster-geloescht");
}

export async function createExtSamplesAction() {
  await requireAdmin();
  const n = await createExtSamples();
  back(n > 0 ? "muster-angelegt" : "muster-vorhanden");
}
