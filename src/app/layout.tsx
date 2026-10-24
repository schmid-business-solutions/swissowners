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
import HeaderPreview, { HEADER_PREVIEW_SCRIPT } from "@/components/HeaderPreview";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { appUrl } from "@/lib/format";

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
  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEADER_PREVIEW_SCRIPT }} />
      </head>
      <body>
        <BetaBar />
        <Header userName={user ? `${user.firstName} ${user.lastName}` : null} account={user ? { firstName: user.firstName, lastName: user.lastName, avatarVersion: user.avatarUpdatedAt ? user.avatarUpdatedAt.getTime() : null } : null} isAdmin={user?.role === "admin"} newRequests={unread} />
        <main className="app">{children}</main>
        <Footer />
        <HeaderPreview />
      </body>
    </html>
  );
}
