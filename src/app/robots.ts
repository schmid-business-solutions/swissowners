import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/format";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/konto", "/admin", "/api", "/zahlung", "/inserat-aufgeben"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
