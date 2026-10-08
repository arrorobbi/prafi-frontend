import { formatRating } from "@/lib/format";
import styles from "./Stars.module.css";

/** ★★★★☆ for a 1-5 value (rounded to the nearest half star). */
export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const filled = Math.round(value * 2) / 2;
  return (
    <span className={`${styles.stars} ${styles[size]}`} aria-label={`${formatRating(value)} dari 5 bintang`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= filled ? styles.on : i - 0.5 === filled ? styles.half : styles.off} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

/** "★ 4,5 (12 ulasan)", or "Belum ada ulasan". */
export function RatingSummary({
  average,
  count,
  size = "sm",
  compact,
}: {
  average: number | null;
  count: number;
  size?: "sm" | "md" | "lg";
  /** Narrow cards: "(2)" instead of "(2 ulasan)", so it fits on one line */
  compact?: boolean;
}) {
  if (!count || average == null) return <span className={styles.none}>Belum ada ulasan</span>;
  return (
    <span className={styles.summary} title={compact ? `${formatRating(average)} dari ${count} ulasan` : undefined}>
      <Stars value={average} size={size} />
      <strong>{formatRating(average)}</strong>
      <span className={styles.count}>({compact ? count : `${count} ulasan`})</span>
    </span>
  );
}
