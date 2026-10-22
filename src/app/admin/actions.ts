"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { approveListing, rejectListing } from "@/lib/billing";

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
