"use client";

import { usePathname } from "next/navigation";
import { PublicSkeleton } from "@/components/site/PageSkeletons";

/**
 * Shown the moment a public link is clicked. When the target page's own loading screen isn't prefetched yet,
 * Next.js shows this one (the nearest it has), so it picks the placeholder from the address being opened:
 * a click on "Produk" shows the product list's shape, not Beranda's.
 */
export default function Loading() {
  return <PublicSkeleton path={usePathname()} />;
}
