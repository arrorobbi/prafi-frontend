"use client";

import { useSlowNavigation } from "@/lib/navPending";
import { PublicSkeleton } from "./PageSkeletons";

/**
 * Public pages: while a clicked page is still on its way (and wasn't prefetched, so Next.js has no loading screen
 * for it yet), show that page's placeholder instead of the old page, so the tap visibly worked.
 */
export function PendingContent({ children }: { children: React.ReactNode }) {
  const pending = useSlowNavigation();
  return pending ? <PublicSkeleton path={pending} /> : <>{children}</>;
}
