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
import { APP_MODE_SCRIPT } from "@/lib/app-mode";
import { Suspense } from "react";
import Link from "next/link";
import AppTabBar from "@/components/AppTabBar";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "SwissOwners – Firmenanteile, Kapital und Verwaltungsräte", template: "%s · SwissOwners" },
  description: "Wo Schweizer Firmen neue Eigentümer, Kapital und Verwaltungsräte finden. Der Marktplatz für KMU und Startups – persönlich geprüft, vertraulich, ohne Provision.",
  openGraph: { siteName: "SwissOwners", locale: "de_CH", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#E0112D" };

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
  /* Website und App teilen dasselbe Markup. Ob die Android-App läuft, erkennt APP_MODE_SCRIPT im Browser-Tab
     und setzt html[data-app]; das CSS blendet dann Website-Teile aus und App-Leisten ein. */
  return (
    <html lang="de-CH" data-header="rot" data-auth={user ? "1" : undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APP_MODE_SCRIPT }} />
      </head>
      <body>
        <div className="site-top">
          <Header userName={user ? `${user.firstName} ${user.lastName}` : null} account={user ? { firstName: user.firstName, lastName: user.lastName, avatarVersion: user.avatarUpdatedAt ? user.avatarUpdatedAt.getTime() : null } : null} isAdmin={user?.role === "admin"} newRequests={unread} />
          <div className="web-only"><BetaBar /></div>
        </div>
        <main className="app">{children}</main>
        <p className="app-legal-bar small app-only"><Link href="/agb">AGB</Link> · <Link href="/datenschutz">Datenschutz</Link> · <Link href="/impressum">Impressum</Link></p>
        <div className="web-only"><Footer /></div>
        {user && <div className="app-only"><Suspense fallback={null}><AppTabBar newRequests={unread} /></Suspense></div>}
      </body>
    </html>
  );
}
