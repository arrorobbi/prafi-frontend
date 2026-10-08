"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { discardUpload, forgetUpload, rememberUpload } from "@/lib/pendingUploads";
import type { ImageFile } from "@/lib/types";
import { IconCheckCircle, IconWarning } from "./Icons";
import { useLeaveGuard } from "./LeaveGuard";
import styles from "./UploadDialog.module.css";

type Phase =
  | { kind: "upload"; percent: number }
  | { kind: "uploaded" }
  | { kind: "saved" }
  | { kind: "error"; title: string; message: string };

/**
 * A photo field's upload, in two steps:
 *  1. pick(file): uploads right away with a progress popup → "Foto berhasil diunggah". The photo is only
 *     *pending*: nothing points at it yet, it's remembered in localStorage, and leaving the page asks first
 *     (LeaveGuard; "Setuju" deletes it).
 *  2. The form's Simpan sends `pending.id` (faceImageId / logoId / imageId) and calls saved() with whether
 *     the saved record really points at it → "Foto telah tersimpan", or the error.
 * Render `dialog` in the form.
 */
export function usePendingImage() {
  const { user } = useAuth();
  const { register } = useLeaveGuard();
  const key = useId();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [pending, setPending] = useState<ImageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<ImageFile | null>(null);
  pendingRef.current = pending;

  const setPreview = (url: string | null) => {
    if (objectUrl.current && objectUrl.current !== url) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
    setPreviewUrl(url);
  };
  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  const show = (next: Phase | null, autoCloseMs?: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPhase(next);
    if (autoCloseMs) closeTimer.current = setTimeout(() => setPhase(null), autoCloseMs);
  };

  /** Deletes the unsaved photo (leaving the form, Batal, or picking another one). */
  const discard = useCallback(async () => {
    const current = pendingRef.current;
    setPending(null);
    setPreview(null);
    if (current) await discardUpload(current.id);
  }, []);

  // While a photo is pending, leaving the page asks first
  useEffect(() => {
    if (!pending) return;
    return register(key, { onLeave: discard, pendingIds: () => (pendingRef.current ? [pendingRef.current.id] : []) });
  }, [pending, key, register, discard]);

  const pick = async (file: File, altText?: string): Promise<ImageFile | null> => {
    const previous = pendingRef.current;
    const previousUrl = objectUrl.current;
    const local = URL.createObjectURL(file);
    objectUrl.current = local;
    setPreviewUrl(local);
    show({ kind: "upload", percent: 0 });
    try {
      const { data: image } = await api.images.upload(file, altText, (percent) => setPhase({ kind: "upload", percent }));
      if (user) rememberUpload(image.id, user.id);
      setPending(image);
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      // A photo picked earlier in this form and replaced before saving isn't needed anymore
      if (previous) void discardUpload(previous.id);
      show({ kind: "uploaded" }, 4000);
      return image;
    } catch (err) {
      // Back to what was shown before (the earlier pending photo, or the saved one)
      URL.revokeObjectURL(local);
      objectUrl.current = previousUrl;
      setPreviewUrl(previousUrl);
      show({ kind: "error", title: "Foto gagal diunggah", message: errorMessage(err) });
      return null;
    }
  };

  /** After Simpan: ok = the saved record points at the pending photo. */
  const saved = (ok: boolean) => {
    const current = pendingRef.current;
    if (!current) return;
    if (ok) {
      forgetUpload(current.id);
      setPending(null);
      show({ kind: "saved" }, 2500);
    } else {
      show({ kind: "error", title: "Foto belum tersimpan", message: "Data tersimpan, tetapi fotonya belum terpasang. Silakan klik Simpan sekali lagi." });
    }
  };

  const showError = (title: string, message: string) => show({ kind: "error", title, message });

  const uploading = phase?.kind === "upload";
  const close = () => show(null);

  const dialog = phase && (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.box} role="dialog" aria-modal="true" aria-live="polite" aria-label="Unggah foto">
        {phase.kind === "error" ? (
          <>
            <span className={`${styles.badge} ${styles.badgeError}`}>
              <IconWarning />
            </span>
            <h2>{phase.title}</h2>
            <p className={styles.text}>{phase.message}</p>
            <button type="button" className="btn btn-navy" onClick={close}>
              Tutup
            </button>
          </>
        ) : phase.kind === "upload" ? (
          <>
            <span className={styles.spinner} aria-hidden />
            <h2>Mengunggah foto...</h2>
            <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase.percent}>
              <span style={{ width: `${phase.percent}%` }} />
            </div>
            <p className={styles.percent}>{phase.percent}%</p>
            <p className={styles.hint}>Mohon tunggu, jangan tutup halaman ini.</p>
          </>
        ) : (
          <>
            <span className={`${styles.badge} ${styles.badgeDone}`}>
              <IconCheckCircle />
            </span>
            <h2>{phase.kind === "saved" ? "Foto telah tersimpan!" : "Foto berhasil diunggah!"}</h2>
            <div className={styles.bar} aria-hidden>
              <span className={styles.barDone} style={{ width: "100%" }} />
            </div>
            <p className={styles.percent}>100%</p>
            <p className={styles.text}>
              {phase.kind === "saved" ? (
                "Foto baru sudah terpasang."
              ) : (
                <>
                  Jangan lupa klik <strong>Simpan</strong> agar foto ini tersimpan.
                </>
              )}
            </p>
            <button type="button" className="btn btn-green" onClick={close}>
              Oke
            </button>
          </>
        )}
      </div>
    </div>
  );

  return { pick, saved, discard, showError, pending, previewUrl, uploading, dialog };
}
