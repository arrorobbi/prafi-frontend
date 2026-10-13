"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, getToken, setToken, TOKEN_KEY, TOKEN_RENEWED_EVENT, UNAUTHORIZED_EVENT } from "./api";
import type { Role, User } from "./types";

type Status = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  status: Status;
  user: User | null;
  /** Logs in and returns the user, so the caller can route by role. */
  login: (email: string, password: string) => Promise<User>;
  logout: (message?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "prafi_user";
export const SESSION_MESSAGE_KEY = "prafi_session_message";

/** Where each role lands after logging in. */
export function roleHome(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "tenant") return "/tenant";
  if (role === "superadmin") return "/superadmin";
  return "/disnakertrans";
}

function cacheUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

function cachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function claims(token: string): { exp?: unknown; iat?: unknown } | null {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/** Milliseconds until the JWT expires (null if it can't be read). */
function msUntilExpiry(token: string) {
  const exp = claims(token)?.exp;
  return typeof exp === "number" ? exp * 1000 - Date.now() : null;
}

/** Milliseconds since the JWT was issued (null if it can't be read). */
function tokenAge(token: string) {
  const iat = claims(token)?.iat;
  return typeof iat === "number" ? Date.now() - iat * 1000 : null;
}

/**
 * Sliding session: a login lasts 1 hour, counted from the last time it was renewed. While the user is using the
 * site (clicks, typing, touches) the token is swapped for a fresh one, at most once per this interval, so only an
 * hour without activity logs them out. The backend stops renewing 12 hours after the login.
 */
const RENEW_AFTER_MS = 60_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

function rememberMessage(message?: string) {
  try {
    if (message) sessionStorage.setItem(SESSION_MESSAGE_KEY, message);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUserState] = useState<User | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    cacheUser(next);
  }, []);

  const clearSession = useCallback(() => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    setToken(null);
    cacheUser(null);
    setUserState(null);
    setStatus("guest");
  }, []);

  /** Ends the session locally when the token runs out (1 hour after the last renewal). */
  const scheduleExpiry = useCallback(
    (token: string) => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      const ms = msUntilExpiry(token);
      if (ms === null) return;
      expiryTimer.current = setTimeout(
        () => {
          rememberMessage("Sesi Anda telah berakhir, silakan login kembali");
          clearSession();
          router.replace("/login");
        },
        Math.max(0, Math.min(ms, 2_147_483_647)),
      );
    },
    [clearSession, router],
  );

  // Restore the session on first load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("guest");
      return;
    }
    const ms = msUntilExpiry(token);
    if (ms !== null && ms <= 0) {
      clearSession();
      return;
    }
    scheduleExpiry(token);
    api.auth
      .me()
      .then(({ data }) => {
        setUser(data);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          clearSession();
        } else {
          // Offline: keep the cached account so the page still renders
          const cached = cachedUser();
          if (cached) {
            setUserState(cached);
            setStatus("authenticated");
          } else {
            setStatus("guest");
          }
        }
      });
  }, [clearSession, scheduleExpiry, setUser]);

  // Sliding session: renew the token while the user is active
  useEffect(() => {
    if (status !== "authenticated") return;
    let renewing = false;
    /** The session reached its maximum length: the current token just runs out */
    let stopped = false;
    const onActivity = () => {
      const token = getToken();
      if (!token || renewing || stopped) return;
      const age = tokenAge(token);
      if (age === null || age < RENEW_AFTER_MS) return;
      renewing = true;
      api.auth
        .refresh()
        .then(({ data }) => {
          // Logged out (or logged in as someone else) while the request was on its way: leave that alone
          if (getToken() !== token) return;
          setToken(data.accessToken);
          scheduleExpiry(data.accessToken);
          window.dispatchEvent(new CustomEvent(TOKEN_RENEWED_EVENT, { detail: data.accessToken }));
        })
        .catch((err) => {
          // 403 = maximum session length. Anything else (offline, a hiccup): try again at the next activity
          if (err instanceof ApiError && err.status === 403) stopped = true;
        })
        .finally(() => {
          renewing = false;
        });
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
  }, [status, scheduleExpiry]);

  // Another tab of this browser renewed the login or logged out: follow it
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY || e.newValue === e.oldValue) return;
      if (e.newValue) {
        scheduleExpiry(e.newValue);
        window.dispatchEvent(new CustomEvent(TOKEN_RENEWED_EVENT, { detail: e.newValue }));
      } else if (e.oldValue) {
        clearSession();
        router.replace("/login");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearSession, router, scheduleExpiry]);

  // Any request answered 401 (expired, logged out elsewhere, password reset) ends the session
  useEffect(() => {
    const onUnauthorized = (e: Event) => {
      rememberMessage((e as CustomEvent<string>).detail || "Sesi Anda telah berakhir, silakan login kembali");
      clearSession();
      router.replace("/login");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.auth.login(email.trim(), password);
      setToken(data.accessToken);
      scheduleExpiry(data.accessToken);
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    },
    [scheduleExpiry, setUser],
  );

  const logout = useCallback(
    async (message?: string) => {
      if (getToken()) await api.auth.logout().catch(() => {});
      rememberMessage(message);
      clearSession();
      router.replace("/login");
    },
    [clearSession, router],
  );

  const refreshUser = useCallback(async () => {
    const { data } = await api.auth.me();
    setUser(data);
  }, [setUser]);

  const value = useMemo(
    () => ({ status, user, login, logout, refreshUser, setUser }),
    [status, user, login, logout, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
