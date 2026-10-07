"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";

/**
 * Unread-notification badge for the dashboards. Polls GET /api/notifications/unread-count every 30 s
 * and whenever the tab regains focus. Pages call `refresh()` after marking notifications read.
 *
 * The backend also pushes `notification:new` / `notification:unread-count` over Socket.IO; using that
 * needs the socket.io-client package (see README → Realtime).
 */
interface NotificationContextValue {
  unread: number;
  refresh: () => void;
  /** Increments every time the count changes upward, so lists can reload. */
  version: number;
}

const NotificationContext = createContext<NotificationContextValue>({ unread: 0, refresh: () => {}, version: 0 });

const POLL_MS = 30_000;

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
