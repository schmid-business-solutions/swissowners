import type { MetadataRoute } from "next";

/* Web-App-Manifest: Grundlage für die Android-App (Trusted Web Activity) und «Zum Startbildschirm hinzufügen». */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SwissOwners – Firmenanteile, Kapital und Verwaltungsräte",
    short_name: "SwissOwners",
    description: "Wo Schweizer Firmen neue Eigentümer, Kapital und Verwaltungsräte finden.",
    lang: "de-CH",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#AF001E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
