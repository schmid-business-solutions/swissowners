import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { isPublic } from "@/lib/listings";
import { appUrl, listingNo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const rows = await db.select({ id: schema.listings.id, u: schema.listings.updatedAt }).from(schema.listings).where(and(isPublic, eq(schema.listings.isSample, false))).catch(() => []);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/inserate`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/preise`, changeFrequency: "monthly" },
    { url: `${base}/beta`, changeFrequency: "monthly" },
    ...rows.map((r) => ({ url: `${base}/inserate/${listingNo(r.id)}`, lastModified: r.u, changeFrequency: "weekly" as const })),
  ];
}
