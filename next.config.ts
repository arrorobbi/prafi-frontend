import type { NextConfig } from "next";

/**
 * The backend (Express) URL. The browser never calls it directly: every request goes to this
 * frontend's own origin and is proxied below, so the backend needs no CORS entry for it.
 * Server components read it too (src/lib/server-api.ts).
 */
const API_URL = (process.env.API_URL ?? "https://api.transniaga.manokwarikab.go.id").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Socket.IO's endpoint is "/socket.io/" with a trailing slash; don't redirect it away
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
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
