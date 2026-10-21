"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { availabilityLabel, STATUS_BADGE, STATUS_LABEL, type ProductStatus } from "@/lib/format";
import { IconBack, IconChevronLeft, IconChevronRight, IconEye, IconEyeOff, IconImagePlus } from "./Icons";
import { canGoBack } from "@/lib/navHistory";
import { useLeaveGuard } from "./LeaveGuard";
import { useLightbox } from "./Lightbox";
import { ImageCropDialog } from "./ImageCropDialog";
import { compressImage, cropHint, MAX_PICK_BYTES, type CropSpec } from "@/lib/imageTools";
import styles from "./ui.module.css";
import { Input } from "./shadcn/input";
import { cn } from "@/lib/utils";
import { Badge } from "./shadcn/badge";
import { Button } from "./shadcn/button";

/** Logo + "TRANSNIAGA / Produk Pilihan Ada Disini", as in the designs. */
export function Brand({ light = false, compact = false, href = "/" }: { light?: boolean; compact?: boolean; href?: string }) {
  return (
    <Link href={href} className={`${styles.brand} ${light ? styles.brandLight : ""} ${compact ? styles.brandCompact : ""}`}>
      <img src="/logo.png" alt="" width={64} height={64} />
      <span>
        <strong>TRANS NIAGA</strong>
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
  backAlways,
}: {
  title: string;
  backHref?: string;
  children?: React.ReactNode;
  hideBrand?: boolean;
  /** Always go to backHref (e.g. login → Beranda), instead of the previous page */
  backAlways?: boolean;
}) {
  const router = useRouter();
  // Asks first when the page has an unsaved photo (LeaveGuard); goes straight back otherwise
  const { confirmLeave } = useLeaveGuard();
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderLeft}>
        <button
          type="button"
          className={styles.back}
          aria-label="Kembali"
          // Back to the previous page of this site; opened directly (link, new tab) → the fallback page
          onClick={() => confirmLeave(() => (canGoBack() && !backAlways ? router.back() : router.push(backHref ?? "/")))}
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
  return <Badge variant={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>;
}

/** "Tersedia" / "Stok Kosong" (product.isAvailable), dashboards only */
export function AvailabilityBadge({ available }: { available: boolean | undefined }) {
  return <Badge variant={available === false ? "rejected" : "active"}>{availabilityLabel(available)}</Badge>;
}

/** "Menampilkan x dari y data" + ◀ 1 2 3 … n ▶ */
/** Page buttons: small square shadcn Buttons */
const PAGE_BTN = { type: "button" as const, size: "sm" as const, shape: "square" as const, className: "h-8 min-h-8 min-w-8 px-2 font-medium normal-case" };

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
          <Button {...PAGE_BTN} variant="light" aria-label="Sebelumnya" disabled={page <= 1} onClick={() => onChange(page - 1)}>
            <IconChevronLeft />
          </Button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                {...PAGE_BTN}
                key={p}
                variant={p === page ? "navy" : "light"}
                aria-current={p === page ? "page" : undefined}
                onClick={() => onChange(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button {...PAGE_BTN} variant="light" aria-label="Berikutnya" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            <IconChevronRight />
          </Button>
        </nav>
      )}
    </div>
  );
}

export function PasswordInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.password}>
      <Input {...props} className={cn("pr-12", className)} type={visible ? "text" : "password"} />
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

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Checks a picked file before it is prepared for upload (jpg/png/webp/gif, up to 25 MB: anything over 3 MB is
 * compressed in the browser, lib/imageTools.ts). Returns an error message or null.
 */
export function validateImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) return "Format gambar harus JPG, PNG, WEBP, atau GIF";
  if (file.size > MAX_PICK_BYTES) return "Ukuran gambar maksimal 25 MB";
  return null;
}

/**
 * The grey "UNGGAH FOTO ..." box with a preview. The file is uploaded by the form on submit.
 * `crop`: the picture is first cut to that shape (ImageCropDialog); without it, it is only compressed to 3 MB.
 * The box says which shape and size suit the place, and the accepted formats.
 */
export function ImagePicker({
  title,
  previewUrl,
  onFile,
  error,
  round,
  pending,
  crop,
}: {
  title: string;
  previewUrl?: string | null;
  onFile: (file: File, previewUrl: string) => void;
  error?: string;
  round?: boolean;
  /** The shown photo is uploaded but not saved yet */
  pending?: boolean;
  crop?: CropSpec;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [toCrop, setToCrop] = useState<{ blob: Blob; url: string; name: string } | null>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  /** Hands a ready file to the form, with a preview address that lives as long as this box */
  const deliver = (file: File) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    onFile(file, objectUrl.current);
  };

  const closeCrop = () => {
    if (toCrop) URL.revokeObjectURL(toCrop.url);
    setToCrop(null);
  };

  return (
    <div className={styles.picker}>
      <label htmlFor={inputId} className={`${styles.pickerBox} ${previewUrl ? styles.hasPreview : ""}`}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Pratinjau"
            className={round ? styles.round : ""}
            style={crop && !round ? { aspectRatio: String(crop.aspect), objectFit: "cover" } : undefined}
          />
        ) : (
          <IconImagePlus className={styles.pickerIcon} />
        )}
        <span className={styles.pickerText}>
          <strong>{previewUrl ? "GANTI FOTO" : title}</strong>
          {crop && <small>{cropHint(crop)}</small>}
          <small>Format: JPG, PNG, WEBP · maks. 3 MB (lebih besar dikompres otomatis)</small>
          <span className={styles.pickerBtn}>{preparing ? "MEMPROSES..." : "PILIH FILE"}</span>
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        disabled={preparing}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const problem = validateImage(file);
          setLocalError(problem);
          if (problem) return;
          if (crop) {
            setToCrop({ blob: file, url: URL.createObjectURL(file), name: file.name });
            return;
          }
          setPreparing(true);
          try {
            deliver(await compressImage(file));
          } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Gambar gagal diproses");
          } finally {
            setPreparing(false);
          }
        }}
      />
      {pending && <span className={styles.pickerPending}>Foto baru belum disimpan. Klik Simpan untuk menyimpannya.</span>}
      {(localError || error) && <span className="field-error">{localError || error}</span>}
      {crop && (
        <ImageCropDialog
          file={toCrop}
          spec={crop}
          onCancel={closeCrop}
          onDone={(cropped) => {
            closeCrop();
            deliver(cropped);
          }}
        />
      )}
    </div>
  );
}

/**
 * Product / logo / guide picture with a fallback when the file is missing.
 * `zoom`: a click (or Enter / Space) opens the picture larger in the popup (Lightbox). Leave it off for pictures
 * inside a link or a clickable card: there the click belongs to the link.
 */
export function Thumb({
  src,
  alt,
  className,
  zoom,
  ...rest
}: { src: string; alt: string; className?: string; zoom?: boolean } & Pick<React.ImgHTMLAttributes<HTMLImageElement>, "width" | "height">) {
  const [broken, setBroken] = useState(false);
  const openLightbox = useLightbox();
  const shown = broken ? "/logo.png" : src;
  const open = (e: React.SyntheticEvent) => {
    // Not also the row or card around it
    e.stopPropagation();
    e.preventDefault();
    openLightbox(shown, alt);
  };
  return (
    <img
      src={shown}
      alt={alt}
      className={cn(className, zoom && "cursor-zoom-in")}
      loading="lazy"
      onError={() => setBroken(true)}
      {...rest}
      {...(zoom && {
        role: "button",
        tabIndex: 0,
        title: "Klik untuk memperbesar",
        "aria-label": `Perbesar gambar${alt ? `: ${alt}` : ""}`,
        onClick: open,
        onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && open(e),
      })}
    />
  );
}
