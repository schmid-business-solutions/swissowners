import { ProfileForm } from "@/components/BoardForms";
import { requireVerifiedUser } from "@/lib/auth";
import { myProfile } from "@/lib/board";

export const metadata = { title: "Mein VR-Profil" };
export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const user = await requireVerifiedUser("/verwaltungsraete/mein-profil");
  const p = await myProfile(user.id);
  return <section style={{ paddingBlock: 36 }}><div className="wrap"><ProfileForm p={p} name={`${user.firstName} ${user.lastName}`} /></div></section>;
}
