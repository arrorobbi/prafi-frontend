"use client";

const KEY = "transniaga_client_id";

/**
 * A random id for this browser, kept in localStorage and sent with reviews. With the visitor's IP the backend allows
 * one review per product per day from the same browser on the same network. Not personal data: just random letters.
 * Without storage (private mode) a new id is made per page view.
 */
export function getClientId() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && /^[A-Za-z0-9-]{8,64}$/.test(saved)) return saved;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
