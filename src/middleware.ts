import { NextResponse, type NextRequest } from "next/server";

/**
 * Plain http:// → https://. The site's port 80 is served by this app directly (nginx only handles 443), so without
 * this, http:// showed the site unencrypted and search engines saw two copies of every page.
 *
 * Requests that came through nginx carry `X-Forwarded-Proto: https`; anything else arriving for the site's own
 * domain is plain http and is sent to the same address on https (308, so the method and body are kept).
 * Left alone: other hosts (localhost and 127.0.0.1: the backend's cache refresh, health checks, local testing).
 */
const SITE = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://transniaga.manokwarikab.go.id");

export function middleware(request: NextRequest) {
  if (SITE.protocol !== "https:") return NextResponse.next();
  const host = (request.headers.get("host") ?? "").toLowerCase().replace(/:\d+$/, "");
  if (host !== SITE.hostname) return NextResponse.next();
  if (request.headers.get("x-forwarded-proto") === "https") return NextResponse.next();
  return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, SITE.origin), 308);
}

export const config = {
  // Everything except Next.js' own static files (they are fetched over whatever the page already uses)
  matcher: ["/((?!_next/static|_next/image).*)"],
};
