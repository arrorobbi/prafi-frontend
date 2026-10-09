"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/** Cloudflare Turnstile site key (public). Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env; empty = no widget. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | null = null;
/** Loads Cloudflare's script once per page */
function loadTurnstile() {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile script failed"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export interface TurnstileHandle {
  /** Tokens work once: get a fresh one after each submit */
  reset: () => void;
}

/**
 * The "not a robot" check (Cloudflare Turnstile): usually passes by itself without a puzzle. `onToken` gets the token
 * to send with the form, or null when it expired / failed (the form should wait for a new one).
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void; onError?: () => void }>(
  function Turnstile({ onToken, onError }, ref) {
    const box = useRef<HTMLDivElement>(null);
    const widget = useRef<string | null>(null);
    const callbacks = useRef({ onToken, onError });
    callbacks.current = { onToken, onError };

    useImperativeHandle(ref, () => ({
      reset: () => {
        callbacks.current.onToken(null);
        if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
      },
    }));

    useEffect(() => {
      if (!TURNSTILE_SITE_KEY) return;
      let cancelled = false;
      loadTurnstile()
        .then((ts) => {
          if (cancelled || !box.current || widget.current) return;
          widget.current = ts.render(box.current, {
            sitekey: TURNSTILE_SITE_KEY,
            language: "id",
            theme: "light",
            action: "review",
            callback: (token: string) => callbacks.current.onToken(token),
            "expired-callback": () => callbacks.current.onToken(null),
            "error-callback": () => {
              callbacks.current.onToken(null);
              callbacks.current.onError?.();
            },
          });
        })
        .catch(() => callbacks.current.onError?.());
      return () => {
        cancelled = true;
        if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
        widget.current = null;
      };
    }, []);

    if (!TURNSTILE_SITE_KEY) return null;
    return <div ref={box} className="min-h-[65px]" />;
  },
);
