import ListingWizard from "@/components/ListingWizard";
import { emptyWizard, type PlanInfo } from "@/lib/wizard";
import { requireVerifiedUser } from "@/lib/auth";
import { startSlotsLeft } from "@/lib/billing";
import { PLANS, PAID_PLANS, startOffer } from "@/lib/plans";
import { date } from "@/lib/format";
import { createListing } from "./actions";

export const metadata = { title: "Inserat aufgeben" };
export const dynamic = "force-dynamic";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ typ?: string }> }) {
  const { typ } = await searchParams;
  await requireVerifiedUser(`/inserat-aufgeben${typ ? `?typ=${typ}` : ""}`);
  const left = await startSlotsLeft();
  const plans: PlanInfo[] = PAID_PLANS.map((id) => ({ id, ...PLANS[id] }));
  return (
    <ListingWizard
      mode="create"
      initial={emptyWizard(typ === "cap" ? "cap" : "sell")}
      plans={plans}
      startLeft={left}
      startUntil={date(startOffer().until)}
      onSubmit={createListing}
    />
  );
}
