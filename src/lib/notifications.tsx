"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useRealtime } from "./realtime";

/**
 * Unread-notification badge for the dashboards. Live over Socket.IO (notification:new / notification:unread-count,
 * see RealtimeProvider); as a fallback it also polls GET /api/notifications/unread-count every 60 s and when the
 * tab regains focus. Pages call `refresh()` after marking notifications read.
 */
interface NotificationContextValue {
  unread: number;
  refresh: () => void;
  /** Increments every time the count changes upward, so lists can reload. */
  version: number;
}

const NotificationContext = createContext<NotificationContextValue>({ unread: 0, refresh: () => {}, version: 0 });

/** Backup only: the live connection normally delivers changes right away */
const POLL_MS = 60_000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unread, setUnread] = useState(0);
  const [version, setVersion] = useState(0);
  const last = useRef(0);

  const refresh = useCallback(() => {
    api.notifications
      .unreadCount()
      .then(({ data }) => {
        if (data.count > last.current) setVersion((v) => v + 1);
        last.current = data.count;
        setUnread(data.count);
      })
      .catch(() => {});
  }, []);

  // Live: a new notification bumps `version` so open lists reload, and the badge updates without a request
  useRealtime<{ unreadCount?: number }>("notification:new", (p) => {
    if (typeof p?.unreadCount === "number") {
      last.current = p.unreadCount;
      setUnread(p.unreadCount);
    }
    setVersion((v) => v + 1);
  });
  useRealtime<{ count?: number }>("notification:unread-count", (p) => {
    if (typeof p?.count !== "number") return;
    last.current = p.count;
    setUnread(p.count);
  });

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return <NotificationContext.Provider value={{ unread, refresh, version }}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
