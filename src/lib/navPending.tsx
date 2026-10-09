"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * Immediate feedback for link clicks. Next.js can only show a route's loading.tsx when it has prefetched it; a quick
 * tap (e.g. in the phone menu, just opened) can come first, and then nothing happens until the server answers, so
 * visitors tap again. This notices clicks on links to another page of the site and reports the target path until the
 * new page arrives: a thin progress bar at the top, and (public pages) the target's placeholder.
 *
 * Dashboard links stopped by the leave-page guard (unsaved photo) never get here: the guard stops the click first.
 */
const PendingCtx = createContext<string | null>(null);

/** The path being opened, or null when no navigation is pending */
export const usePendingPath = () => useContext(PendingCtx);

/** Feedback only for navigations slower than this, so instant pages don't flicker */
export const PENDING_DELAY_MS = 120;
/** Give up waiting after this (navigation failed or was cancelled) */
const PENDING_TIMEOUT_MS = 15_000;

export function NavPendingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState<string | null>(null);

  // The new page arrived
  useEffect(() => setPending(null), [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Not pages of this app (proxied API, images, the server guide), or the same page (filters, #anchors)
      if (/^\/(api|images|socket\.io)(\/|$)/.test(url.pathname) || url.pathname === location.pathname) return;
      setPending(url.pathname);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(null), PENDING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [pending]);

  return (
    <PendingCtx.Provider value={pending}>
      {children}
      {pending && <div className="nav-progress" role="progressbar" aria-label="Memuat halaman" aria-busy="true" />}
    </PendingCtx.Provider>
  );
}

/** true once a navigation has been pending for PENDING_DELAY_MS */
export function useSlowNavigation() {
  const pending = usePendingPath();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!pending) return;
    const t = setTimeout(() => setSlow(true), PENDING_DELAY_MS);
    return () => clearTimeout(t);
  }, [pending]);
  return slow ? pending : null;
}
