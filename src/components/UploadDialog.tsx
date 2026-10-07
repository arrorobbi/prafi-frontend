"use client";

import { useCallback, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { IconCheckCircle, IconWarning } from "./Icons";
import styles from "./UploadDialog.module.css";

type Phase = { kind: "upload"; percent: number } | { kind: "save" } | { kind: "done" } | { kind: "error"; message: string };

interface RunOptions<T> {
  file: File;
  altText?: string;
  /** Saves the uploaded image where it belongs (user.faceImageId, tenant.logoId, product.imageId…) */
  save: (imageId: number) => Promise<T>;
  /** Checks the saved record really points at the image (its id is set and the image exists) */
  isSaved: (saved: T, imageId: number) => boolean;
}

/**
 * Popup for an image upload: progress (0-100%) → saving → "Gambar telah tersimpan", or the real error.
 * `run` resolves with the saved record, or null when anything failed (the popup shows why).
 * Render `dialog` somewhere in the component.
 */
export function useImageUpload() {
  const [phase, setPhase] = useState<Phase | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPhase(null);
  }, []);

  const run = useCallback(async <T,>({ file, altText, save, isSaved }: RunOptions<T>): Promise<T | null> => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPhase({ kind: "upload", percent: 0 });
    let imageId: number | null = null;
    try {
      const { data: image } = await api.images.upload(file, altText, (percent) => setPhase({ kind: "upload", percent }));
      imageId = image.id;
      setPhase({ kind: "save" });
      const saved = await save(image.id);
      if (!isSaved(saved, image.id)) {
        throw new Error("Gambar terunggah tetapi belum tersimpan pada data. Silakan coba lagi.");
      }
      imageId = null;
      setPhase({ kind: "done" });
      closeTimer.current = setTimeout(() => setPhase(null), 1800);
      return saved;
    } catch (err) {
      setPhase({ kind: "error", message: errorMessage(err) });
      // Don't leave an unused upload behind
      if (imageId !== null) api.images.remove(imageId).catch(() => {});
      return null;
    }
  }, []);

  const percent = phase?.kind === "upload" ? phase.percent : phase?.kind === "error" ? null : 100;
  const busy = phase?.kind === "upload" || phase?.kind === "save";

  const dialog = phase && (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.box} role="dialog" aria-modal="true" aria-live="polite" aria-label="Unggah gambar">
        {phase.kind === "error" ? (
          <>
            <IconWarning className={`${styles.icon} ${styles.iconError}`} />
            <h2>Gagal mengunggah gambar</h2>
            <p className={styles.error}>{phase.message}</p>
            <button type="button" className="btn btn-navy" onClick={close}>
              Tutup
            </button>
          </>
        ) : (
          <>
            {phase.kind === "done" ? (
              <IconCheckCircle className={`${styles.icon} ${styles.iconDone}`} />
            ) : (
              <span className={styles.spinner} aria-hidden />
            )}
            <h2>
              {phase.kind === "upload" ? "Mengunggah gambar..." : phase.kind === "save" ? "Menyimpan..." : "Gambar telah tersimpan"}
            </h2>
            <div
              className={styles.bar}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent ?? 0}
            >
              <span style={{ width: `${percent ?? 0}%` }} className={phase.kind === "done" ? styles.barDone : ""} />
            </div>
            <p className={styles.percent}>{percent ?? 0}%</p>
            {phase.kind === "done" && (
              <button type="button" className="btn btn-green" onClick={close}>
                OK
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return { run, dialog, busy };
}
