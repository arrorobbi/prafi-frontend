"use client";

import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

/** Accessible dialog built on <dialog>. */
export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ""}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={styles.body}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button type="button" className={styles.x} aria-label="Tutup" onClick={onClose}>
            ×
          </button>
        </header>
        <div className={styles.content}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Ya, lanjutkan", danger, busy, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-light" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="button" className={`btn ${danger ? "btn-red" : "btn-navy"}`} onClick={onConfirm} disabled={busy}>
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className={styles.message}>{message}</div>
    </Modal>
  );
}
