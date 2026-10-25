import OrgForm from "@/components/OrgForm";
import { requireVerifiedUser } from "@/lib/auth";

export const metadata = { title: "Partnerprofil erstellen" };
export const dynamic = "force-dynamic";

export default async function NewOrgPage() {
  await requireVerifiedUser("/partner/neu");
  return <section style={{ paddingBlock: 36 }}><div className="wrap"><OrgForm /></div></section>;
}
