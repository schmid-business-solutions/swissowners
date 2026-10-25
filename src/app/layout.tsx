import type { Metadata, Viewport } from "next";
import { and, eq, isNull, sql } from "drizzle-orm";
import "@fontsource/hanken-grotesk/latin-400.css";
import "@fontsource/hanken-grotesk/latin-500.css";
import "@fontsource/hanken-grotesk/latin-600.css";
import "@fontsource/hanken-grotesk/latin-700.css";
import "@fontsource/hanken-grotesk/latin-800.css";
import "./globals.css";
import Header from "@/components/Header";
import BetaBar from "@/components/BetaBar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { appUrl } from "@/lib/format";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Link from "next/link";
import AppTabBar from "@/components/AppTabBar";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "SwissOwners – Schweizer Firmenanteile", template: "%s · SwissOwners" },
  description: "Der Marktplatz für nicht kotierte Firmenanteile in der Schweiz. Anteile verkaufen, Kapital suchen, Beteiligungen finden – direkt verhandeln, ohne Provision.",
  openGraph: { siteName: "SwissOwners", locale: "de_CH", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#AF001E" };

async function unreadRequests(userId: number) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.contactRequests)
    .innerJoin(schema.listings, eq(schema.listings.id, schema.contactRequests.listingId))
    .where(and(eq(schema.listings.ownerId, userId), isNull(schema.contactRequests.readAt)));
  return Number(row?.n ?? 0);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser().catch(() => null);
  const unread = user ? await unreadRequests(user.id).catch(() => 0) : 0;
  /* App-Modus: in der Android-App (Cookie vom Proxy) feste App-Leisten statt Website-Header/-Footer */
  const app = (await cookies()).get("swo_app")?.value === "1";
  return (
    <html lang="de-CH" data-header="rot" data-app={app ? "1" : undefined}>
      <body>
        {!app && <BetaBar />}
        <Header userName={user ? `${user.firstName} ${user.lastName}` : null} account={user ? { firstName: user.firstName, lastName: user.lastName, avatarVersion: user.avatarUpdatedAt ? user.avatarUpdatedAt.getTime() : null } : null} isAdmin={user?.role === "admin"} newRequests={unread} appMode={app} />
        <main className="app">{children}</main>
        {app ? (
          <p className="app-legal-bar small"><Link href="/agb">AGB</Link> · <Link href="/datenschutz">Datenschutz</Link> · <Link href="/impressum">Impressum</Link></p>
        ) : <Footer />}
        {app && user && <Suspense fallback={null}><AppTabBar newRequests={unread} /></Suspense>}
      </body>
    </html>
  );
}
