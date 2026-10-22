import type { NextConfig } from "next";

/* Hostinger stellt einen Reverse-Proxy vor die App. Dabei passt der Host-Header nicht immer zur
   öffentlichen Domain, und Next.js würde Formular-Übermittlungen (Server Actions) als CSRF ablehnen.
   Deshalb die öffentlichen Domains ausdrücklich erlauben. */
const appHost = (() => {
  try {
    return new URL(process.env.APP_URL ?? "").host;
  } catch {
    return "";
  }
})();
const allowedOrigins = [appHost, "swissowners.ch", "www.swissowners.ch", "*.swissowners.ch", "*.hostingersite.com"].filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { allowedOrigins },
  },
  serverExternalPackages: ["mysql2", "bcryptjs", "nodemailer"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
