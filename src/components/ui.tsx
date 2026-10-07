"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { STATUS_BADGE, STATUS_LABEL, type ProductStatus } from "@/lib/format";
import { IconBack, IconChevronLeft, IconChevronRight, IconEye, IconEyeOff, IconImagePlus } from "./Icons";
import styles from "./ui.module.css";

/** Logo + "TRANSNIAGA / Produk Pilihan Ada Disini", as in the designs. */
export function Brand({ light = false, compact = false, href = "/" }: { light?: boolean; compact?: boolean; href?: string }) {
  return (
    <Link href={href} className={`${styles.brand} ${light ? styles.brandLight : ""} ${compact ? styles.brandCompact : ""}`}>
      <img src="/logo.png" alt="" width={64} height={64} />
      <span>
        <strong>TRANSNIAGA</strong>
        <em>Produk Pilihan Ada Disini</em>
      </span>
    </Link>
  );
}

/** Back arrow + orange title on the left, brand on the right (top of every inner page). */
export function PageHeader({
  title,
  backHref,
  children,
  hideBrand,
}: {
  title: string;
  backHref?: string;
  children?: React.ReactNode;
  hideBrand?: boolean;
}) {
  const router = useRouter();
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderLeft}>
        <button
          type="button"
          className={styles.back}
          aria-label="Kembali"
          onClick={() => (backHref ? router.push(backHref) : router.back())}
        >
          <IconBack />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      {children && <div className={styles.pageHeaderMiddle}>{children}</div>}
      {!hideBrand && (
        <div className={styles.pageHeaderBrand}>
          <Brand />
        </div>
      )}
    </header>
  );
}

export function Loading({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className={styles.loading} role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.empty}>
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  return <span className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</span>;
}

/** "Menampilkan x dari y data" + ◀ 1 2 3 … n ▶ */
export function Pagination({
  page,
  totalPages,
  total,
  shown,
  noun = "data",
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  shown: number;
  noun?: string;
  onChange: (page: number) => void;
}) {
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className={styles.pagination}>
      <span className="muted">
        Menampilkan {shown} dari {total} {noun}
      </span>
      {totalPages > 1 && (
        <nav aria-label="Halaman" className={styles.pages}>
          <button type="button" aria-label="Sebelumnya" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            <IconChevronLeft />
          </button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap${i}`}>…</span>
            ) : (
              <button
                type="button"
                key={p}
                className={p === page ? styles.current : ""}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" aria-label="Berikutnya" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            <IconChevronRight />
          </button>
        </nav>
      )}
    </div>
  );
}

export function PasswordInput({
  className = "input",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.password}>
      <input {...props} className={className} type={visible ? "text" : "password"} />
      <button
        type="button"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Checks a picked file against the API's rules (jpg/png/webp/gif, max 5 MB). Returns an error message or null. */
export function validateImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return "Format gambar harus JPG, PNG, WEBP, atau GIF";
  if (file.size > MAX_IMAGE_BYTES) return "Ukuran gambar maksimal 5 MB";
  return null;
}

/** The grey "UNGGAH FOTO ..." box with a preview. The file is uploaded by the form on submit. */
export function ImagePicker({
  title,
  previewUrl,
  onFile,
  error,
  round,
}: {
  title: string;
  previewUrl?: string | null;
  onFile: (file: File, previewUrl: string) => void;
  error?: string;
  round?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  return (
    <div className={styles.picker}>
      <label htmlFor={inputId} className={`${styles.pickerBox} ${previewUrl ? styles.hasPreview : ""}`}>
        {previewUrl ? (
          <img src={previewUrl} alt="Pratinjau" className={round ? styles.round : ""} />
        ) : (
          <IconImagePlus className={styles.pickerIcon} />
        )}
        <span className={styles.pickerText}>
          <strong>{previewUrl ? "GANTI FOTO" : title}</strong>
          <small>Format: JPG, PNG, WEBP (maks. 5MB)</small>
          <span className={styles.pickerBtn}>PILIH FILE</span>
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const problem = validateImage(file);
          setLocalError(problem);
          if (problem) return;
          if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
          objectUrl.current = URL.createObjectURL(file);
          onFile(file, objectUrl.current);
        }}
      />
      {(localError || error) && <span className="field-error">{localError || error}</span>}
    </div>
  );
}

/** Product / logo thumbnail with a fallback when the file is missing. */
export function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <img
      src={broken ? "/logo.png" : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}
