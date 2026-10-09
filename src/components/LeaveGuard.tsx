"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { IconWarning } from "./Icons";
import { Modal } from "./Modal";
import styles from "./LeaveGuard.module.css";
import { Button } from "@/components/shadcn/button";

/**
 * Asks before leaving a form that has an uploaded-but-unsaved photo. "Setuju" runs each guard's onLeave
 * (deletes the photo) and then leaves; "Lanjut Suntingan" closes the box and stays.
 *
 * Catches: links (menu, logo…), the page header's back arrow, Batal/Logout buttons (via confirmLeave),
 * the browser/phone back button, and closing or reloading the tab (browser's own prompt).
 */
interface Guard {
  /** Cleanup when the user agrees to leave, e.g. delete the unsaved photo */
  onLeave: () => Promise<void> | void;
  /** Photo ids to delete with keepalive when the tab closes */
  pendingIds: () => number[];
}

interface LeaveGuardValue {
  /** Runs `action` right away, or after the user agrees to leave when a guard is active (title: e.g. for Batal) */
  confirmLeave: (action: () => void | Promise<void>, title?: string) => void;
  register: (key: string, guard: Guard) => () => void;
}

const Ctx = createContext<LeaveGuardValue>({
  confirmLeave: (action) => void action(),
  register: () => () => {},
});

export const useLeaveGuard = () => useContext(Ctx);

const LEAVE_TITLE = "Tinggalkan halaman ini?";

/** Marks our extra history entry, so the back button lands on it first instead of leaving the page */
const MARK = "__transniagaLeaveGuard";

export function LeaveGuardProvider({
  children,
  onUnload,
  onAsk,
}: {
  children: React.ReactNode;
  onUnload: (ids: number[]) => void;
  /** Called when the "leave this page?" dialog opens, e.g. so the dashboard closes its phone sidebar (it covers the dialog) */
  onAsk?: () => void;
}) {
  const router = useRouter();
  const onAskRef = useRef(onAsk);
  onAskRef.current = onAsk;
  const guards = useRef(new Map<string, Guard>());
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState<(() => void | Promise<void>) | null>(null);
  const [title, setTitle] = useState(LEAVE_TITLE);
  const [leaving, setLeaving] = useState(false);

  const register = useCallback((key: string, guard: Guard) => {
    guards.current.set(key, guard);
    setActive(true);
    return () => {
      guards.current.delete(key);
      setActive(guards.current.size > 0);
    };
  }, []);

  const confirmLeave = useCallback((action: () => void | Promise<void>, customTitle?: string) => {
    if (guards.current.size === 0) return void action();
    onAskRef.current?.();
    setTitle(customTitle ?? LEAVE_TITLE);
    setPending(() => action);
  }, []);
  const ask = (action: () => void | Promise<void>) => {
    onAskRef.current?.();
    setTitle(LEAVE_TITLE);
    setPending(() => action);
  };

  const agree = async () => {
    if (!pending) return;
    setLeaving(true);
    const action = pending;
    try {
      for (const g of [...guards.current.values()]) await g.onLeave();
    } finally {
      guards.current.clear();
      setActive(false);
      setLeaving(false);
      setPending(null);
    }
    await action();
  };

  // Links: stop the navigation (and Next's own Link handler) and ask first
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      e.stopPropagation();
      ask(() => router.push(url.pathname + url.search + url.hash));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active, router]);

  // Back button (browser / phone): an extra history entry catches the first press
  useEffect(() => {
    if (!active) return;
    if (!history.state?.[MARK]) history.pushState({ ...history.state, [MARK]: true }, "", location.href);
    const onPop = () => {
      if (guards.current.size === 0) return;
      history.pushState({ ...history.state, [MARK]: true }, "", location.href);
      // Leaving = going back past our entry and the page itself
      ask(() => history.go(-2));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [active]);

  // Closing / reloading the tab: the browser shows its own prompt (it can't show ours)
  useEffect(() => {
    if (!active) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const pageHide = () => onUnload([...guards.current.values()].flatMap((g) => g.pendingIds()));
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pagehide", pageHide);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pagehide", pageHide);
    };
  }, [active, onUnload]);

  const value = useMemo(() => ({ confirmLeave, register }), [confirmLeave, register]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Modal open={pending !== null} title={title} onClose={() => !leaving && setPending(null)}>
        <div className={styles.body}>
          <span className={styles.icon}>
            <IconWarning />
          </span>
          <p className={styles.lead}>Foto yang baru Anda unggah belum disimpan.</p>
          <p>
            Jika keluar sekarang, foto itu akan <strong>dihapus</strong> dan <strong>tidak ada data yang berubah</strong>. Pilih{" "}
            <strong>Lanjut Suntingan</strong> lalu klik <strong>Simpan</strong> bila ingin menyimpannya.
          </p>
          <div className={styles.actions}>
            <Button type="button" variant="orange" onClick={() => setPending(null)} disabled={leaving} autoFocus>
              Lanjut Suntingan
            </Button>
            <Button type="button" variant="light" onClick={agree} disabled={leaving}>
              {leaving ? "Menghapus foto..." : "Setuju"}
            </Button>
          </div>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}
