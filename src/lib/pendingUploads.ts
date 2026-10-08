"use client";

import { api, getToken } from "./api";

/**
 * Images uploaded in a form but not saved yet (no user/tenant/product points at them). Kept in localStorage
 * so they can still be deleted if the tab is closed or crashes before the user saves or leaves the form.
 */
const KEY = "transniaga_pending_uploads";
/** Older than this, the form they belonged to is gone (the login also expires after an hour) */
const STALE_MS = 60 * 60 * 1000;

interface Entry {
  id: number;
  userId: string;
  at: number;
}

function read(): Entry[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    if (entries.length) localStorage.setItem(KEY, JSON.stringify(entries));
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable (private mode): nothing to remember
  }
}

export function rememberUpload(id: number, userId: string) {
  write([...read().filter((e) => e.id !== id), { id, userId, at: Date.now() }]);
}

export function forgetUpload(id: number) {
  write(read().filter((e) => e.id !== id));
}

/** Deletes an unsaved upload (only works for your own image that nothing uses yet). */
export async function discardUpload(id: number) {
  try {
    await api.images.remove(id);
  } catch {
    // already gone, or saved after all (409): either way nothing to clean up
  }
  forgetUpload(id);
}

/** Leftovers from an earlier visit (closed tab, crash): delete this user's stale ones. */
export async function cleanupStaleUploads(userId: string) {
  const now = Date.now();
  for (const e of read()) {
    if (e.userId === userId && now - e.at > STALE_MS) await discardUpload(e.id);
  }
}

/** Closing the tab: a normal request may be cut off, keepalive lets it finish. Best effort. */
export function discardOnUnload(ids: number[]) {
  const token = getToken();
  for (const id of ids) {
    fetch(`/api/images/${id}`, {
      method: "DELETE",
      keepalive: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(() => forgetUpload(id))
      .catch(() => {});
  }
}
