import { notFound } from "next/navigation";
import OrgForm from "@/components/OrgForm";
import { requireVerifiedUser } from "@/lib/auth";
import { getOrgBySlug, membership } from "@/lib/orgs";

export const metadata = { title: "Partnerprofil bearbeiten" };
export const dynamic = "force-dynamic";

export default async function EditOrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireVerifiedUser(`/partner/${slug}/bearbeiten`);
  const o = await getOrgBySlug(slug);
  if (!o || o.isSample || (await membership(o.id, user.id))?.role !== "admin") notFound();
  return <section style={{ paddingBlock: 36 }}><div className="wrap"><OrgForm org={o} /></div></section>;
}
