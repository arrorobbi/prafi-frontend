import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

/**
 * /robots.txt. Crawlers may read every page; what must stay out of search results (dashboards, login, password and
 * verification pages) is marked "noindex" with a header instead (next.config.ts), because a page that is blocked
 * here can still be listed by its address alone. Only non-pages are blocked from crawling.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/internal/", "/socket.io/"] }],
    sitemap: abs("/sitemap.xml"),
    host: abs("/").replace(/\/$/, ""),
  };
}
