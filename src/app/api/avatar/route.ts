import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Profilbild der angemeldeten Person (nur für sie selbst sichtbar) */
export async function GET() {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });
  const [a] = await db.select().from(schema.userAvatars).where(eq(schema.userAvatars.userId, user.id)).limit(1);
  if (!a) return new Response(null, { status: 404 });
  return new Response(Buffer.from(a.data, "base64"), {
    headers: { "Content-Type": a.mime, "Cache-Control": "private, max-age=86400" },
  });
}
