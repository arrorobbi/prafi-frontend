"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getToken, UNAUTHORIZED_EVENT } from "./api";
import { useAuth } from "./auth";

/**
 * One Socket.IO connection per signed-in tab, through this site's own /socket.io/ proxy (next.config.ts), so no
 * CORS. The backend pushes:
 *   notification:new / notification:unread-count — your notifications (all roles)
 *   log:new — a new API log row (superadmins only)
 *   session:ended — your session ended (expired, logged out, deactivated, password reset)
 * Pages listen with useRealtime(event, handler). Without a connection everything still works by polling/reloading.
 */
type Handler = (payload: never) => void;

interface RealtimeValue {
  connected: boolean;
  subscribe: (event: string, handler: Handler) => () => void;
}

const Ctx = createContext<RealtimeValue>({ connected: false, subscribe: () => () => {} });

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const handlers = useRef(new Map<string, Set<Handler>>());

  useEffect(() => {
    const token = getToken();
    if (status !== "authenticated" || !user || !token) return;

    const socket = io({ path: "/socket.io/", auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    // The server ended the session: log out this tab like an expired login does
    socket.on("session:ended", (p: { message?: string }) => {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: p?.message }));
    });
    // Hand every other event to the pages listening for it
    socket.onAny((event: string, payload: unknown) => {
      handlers.current.get(event)?.forEach((h) => (h as (p: unknown) => void)(payload));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
    // A new login (other user / new token) reconnects
  }, [status, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const subscribe = useCallback((event: string, handler: Handler) => {
    const set = handlers.current.get(event) ?? new Set<Handler>();
    set.add(handler);
    handlers.current.set(event, set);
    return () => {
      set.delete(handler);
    };
  }, []);

  return <Ctx.Provider value={{ connected, subscribe }}>{children}</Ctx.Provider>;
}

/** Whether the live connection is up (e.g. for a "Live" badge). */
export const useRealtimeStatus = () => useContext(Ctx).connected;

/** Runs `handler` for every `event` pushed by the server while the component is mounted. */
export function useRealtime<T>(event: string, handler: (payload: T) => void) {
  const { subscribe } = useContext(Ctx);
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => subscribe(event, ((p: T) => latest.current(p)) as Handler), [event, subscribe]);
}
