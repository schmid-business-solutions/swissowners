"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function setContactStatusAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const done = fd.get("done") === "1";
  if (!id) return;
  await db.update(schema.contactMessages).set({ status: done ? "done" : "new", doneAt: done ? new Date() : null }).where(eq(schema.contactMessages.id, id));
  revalidatePath("/admin/kontakt");
}
