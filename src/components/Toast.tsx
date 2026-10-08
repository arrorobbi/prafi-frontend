"use client";

import { toast } from "sonner";
import { Toaster } from "./shadcn/sonner";

/** Renders the shadcn Sonner toasts once for the whole app (root layout). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors closeButton visibleToasts={4} />
    </>
  );
}

/** Same API as before: toast.success / error / info (title, optional message), now shown by Sonner. */
export function useToast() {
  return {
    success: (title: string, message?: string) => toast.success(title, { description: message, duration: 4000 }),
    error: (title: string, message?: string) => toast.error(title, { description: message, duration: 6000 }),
    info: (title: string, message?: string) => toast.info(title, { description: message, duration: 4000 }),
  };
}
