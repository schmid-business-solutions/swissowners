import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { MandateForm } from "@/components/BoardForms";
import { requireVerifiedUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { myOrgs } from "@/lib/orgs";

export const metadata = { title: "VR-Mandat inserieren" };
export const dynamic = "force-dynamic";

export default async function NewMandatePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const user = await requireVerifiedUser(`/verwaltungsraete/mandat-inserieren${id ? `?id=${id}` : ""}`);
  let m;
  if (id) {
    [m] = await db.select().from(schema.boardMandates).where(and(eq(schema.boardMandates.id, Number(id)), eq(schema.boardMandates.ownerId, user.id))).limit(1);
    if (!m) notFound();
  }
  const orgs = (await myOrgs(user.id)).filter((x) => x.org.status === "online").map((x) => ({ id: x.org.id, name: x.org.name }));
  return <section style={{ paddingBlock: 36 }}><div className="wrap"><MandateForm m={m} orgs={orgs} /></div></section>;
}
