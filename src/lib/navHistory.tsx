"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * The pages visited in this tab, so a page's back arrow can return to where the visitor came from instead of a
 * fixed page. Kept in sessionStorage (per tab, survives reloads). A visit to the page just before the current one
 * counts as going back, so the list stays the browser's own history.
 */
const KEY = "transniaga_nav_stack";
const MAX = 50;

function read(): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(stack: string[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-MAX)));
  } catch {
    // storage unavailable: back arrows use their fallback page
  }
}

/** Whether there is an earlier page of this site in this tab to go back to. */
export function canGoBack() {
  return read().length > 1;
}

/** Records every page change (rendered once, in the root layout). */
export function NavHistoryTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const url = `${pathname}${search.size ? `?${search}` : ""}`;

  useEffect(() => {
    const stack = read();
    if (stack[stack.length - 1] === url) return;
    if (stack[stack.length - 2] === url) stack.pop();
    else stack.push(url);
    write(stack);
  }, [url]);

  return null;
}
