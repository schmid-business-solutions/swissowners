import Link from "next/link";
import { BETA, BETA_UNTIL } from "@/lib/beta";

/** Schmaler Hinweis über dem Header während der Beta-Phase */
export default function BetaBar() {
  if (!BETA) return null;
  return (
    <div className="beta-bar" role="note">
      <div className="wrap">
        <span className="beta-tag beta-tag-inv">Beta</span>
        <span>SwissOwners ist in der Testphase bis {BETA_UNTIL}. Danach starten wir offiziell.</span>
        <Link href="/beta">Mehr erfahren</Link>
      </div>
    </div>
  );
}
