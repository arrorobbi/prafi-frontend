import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { LANDING_TAG } from "@/lib/server-api";

/**
 * POST /internal/revalidate — called by the backend right after a change visitors can see (product approved or
 * edited, new review, category, UMKM profile…), so the landing pages show it at once instead of after their 60 s
 * cache. Needs the shared secret (REVALIDATE_SECRET, the same in both .env files) in the x-revalidate-secret header.
 * Not under /api: that path is proxied to the backend.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? "";
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Secret tidak valid" } }, { status: 401 });
  }
  revalidateTag(LANDING_TAG);
  // Beranda is a prerendered page: rebuild it on the next visit too
  revalidatePath("/");
  return Response.json({ success: true, data: { revalidated: true, at: new Date().toISOString() } });
}
