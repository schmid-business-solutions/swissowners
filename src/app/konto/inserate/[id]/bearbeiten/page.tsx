import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import ListingWizard from "@/components/ListingWizard";
import type { WizardData } from "@/lib/wizard";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { updateListing } from "@/app/inserat-aufgeben/actions";

export const metadata = { title: "Angebot bearbeiten" };
export const dynamic = "force-dynamic";

const s = (n: number | null | undefined) => (n == null ? "" : String(n));

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const user = await requireUser(`/konto/inserate/${id}/bearbeiten`);
  const [l] = await db.select().from(schema.listings).where(and(eq(schema.listings.id, id), eq(schema.listings.ownerId, user.id))).limit(1);
  if (!l) notFound();
  const initial: WizardData = {
    type: l.type, segment: l.segment, branche: l.branche, sub: l.sub, kanton: l.kanton, legalForm: l.legalForm,
    revenueClass: l.revenueClass, employees: s(l.employees), foundedYear: s(l.foundedYear), phase: l.phase ?? "",
    shareClass: l.shareClass ?? "unklar", companyName: l.companyName, companyUid: l.companyUid, companyInformed: l.companyInformed,
    title: l.title, stake: l.stake ?? "", amount: s(l.amount), valuation: s(l.valuation), minTicket: s(l.minTicket),
    vinkuliert: l.vinkuliert, vorkauf: l.vorkauf, description: l.description, reason: l.reason, plan: l.plan, agb: false,
  };
  return <ListingWizard mode="edit" initial={initial} plans={[]} startLeft={0} startUntil="" onSubmit={updateListing.bind(null, id)} />;
}
