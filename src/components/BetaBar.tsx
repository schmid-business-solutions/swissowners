import Link from "next/link";
import { BETA, BETA_UNTIL } from "@/lib/beta";

/** Schmaler Hinweis direkt unter dem Header während der Beta-Phase (fixiert mit dem Header) */
export default function BetaBar() {
  if (!BETA) return null;
  return (
    <div className="beta-bar" role="note">
      <div className="wrap">
        <span className="beta-tag beta-tag-inv">Beta</span>
        <span className="beta-txt"><span className="beta-more">SwissOwners ist in der </span>Testphase bis {BETA_UNTIL}.<span className="beta-more"> Danach starten wir offiziell.</span></span>
        <Link href="/beta">Mehr erfahren</Link>
      </div>
    </div>
  );
}
