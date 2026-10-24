"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { approveListing, rejectListing } from "@/lib/billing";
import { createSamples, deleteAllSamples, deleteOldestSample, deleteSample } from "@/lib/sample-admin";

export async function approveAction(fd: FormData) {
  await requireAdmin();
  await approveListing(Number(fd.get("id")));
  revalidatePath("/admin");
  redirect("/admin?ok=freigeschaltet");
}

export async function rejectAction(fd: FormData) {
  await requireAdmin();
  const reason = String(fd.get("reason") ?? "").trim();
  const id = Number(fd.get("id"));
  if (reason.length < 5) redirect(`/admin/inserate/${id}?err=grund`);
  await rejectListing(id, reason);
  revalidatePath("/admin");
  redirect("/admin?ok=abgelehnt");
}

/* ---------- Musterangebote ---------- */

const backToSamples = (msg: string) => {
  revalidatePath("/");
  revalidatePath("/inserate");
  revalidatePath("/admin");
  redirect(`/admin?status=muster&ok=${msg}`);
};

export async function createSamplesAction() {
  await requireAdmin();
  const n = await createSamples();
  backToSamples(n > 0 ? "muster-angelegt" : "muster-vorhanden");
}

export async function deleteSampleAction(fd: FormData) {
  await requireAdmin();
  await deleteSample(Number(fd.get("id")));
  backToSamples("muster-geloescht");
}

export async function deleteOldestSampleAction() {
  await requireAdmin();
  await deleteOldestSample();
  backToSamples("muster-geloescht");
}

export async function deleteAllSamplesAction() {
  await requireAdmin();
  await deleteAllSamples();
  backToSamples("muster-alle-geloescht");
}
