import type { NextConfig } from "next";

/**
 * The backend (Express) URL. The browser never calls it directly: every request goes to this
 * frontend's own origin and is proxied below, so the backend needs no CORS entry for it.
 * Server components read it too (src/lib/server-api.ts).
 */
const API_URL = (process.env.API_URL ?? "https://api.transniaga.manokwarikab.go.id").replace(/\/+$/, "");

/** This site's public address, for links shared outside it (e.g. the product link in a WhatsApp message). */
const SITE_URL = (process.env.SITE_URL ?? "https://transniaga.manokwarikab.go.id").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Socket.IO's endpoint is "/socket.io/" with a trailing slash; don't redirect it away
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
    NEXT_PUBLIC_SITE_URL: SITE_URL,
  },
  /**
   * Pages that must never appear in search results: dashboards, login, password and verification pages, the admin
   * sign-up. A header (not robots.txt): crawlers must be able to open a page to see that it says "noindex".
   */
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      "/admin/:path*",
      "/superadmin/:path*",
      "/disnakertrans/:path*",
      "/tenant/:path*",
      "/akun/:path*",
      "/login",
      "/lupa-password",
      "/reset-password",
      "/verifikasi",
      "/register/admin",
      "/maintenance",
      "/internal/:path*",
    ].map((source) => ({ source, headers: noindex }));
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      { source: "/images/:path*", destination: `${API_URL}/images/:path*` },
      { source: "/socket.io/", destination: `${API_URL}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${API_URL}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
