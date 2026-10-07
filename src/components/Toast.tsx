"use client";

import { createContext, useCallback, useContext, useState } from "react";
import styles from "./Toast.module.css";

type Kind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: Kind;
  title: string;
  message?: string;
}

const ToastContext = createContext<((kind: Kind, title: string, message?: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: Kind, title: string, message?: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-3), { id, kind, title, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "error" ? 6000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.kind]}`}>
            <strong>{t.title}</strong>
            {t.message && <span>{t.message}</span>}
            <button
              className={styles.close}
              aria-label="Tutup"
              onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return {
    success: (title: string, message?: string) => show("success", title, message),
    error: (title: string, message?: string) => show("error", title, message),
    info: (title: string, message?: string) => show("info", title, message),
  };
}
