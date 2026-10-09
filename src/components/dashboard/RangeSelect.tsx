"use client";

import { IconCalendar } from "../Icons";
import styles from "./dashboard.module.css";
import { NativeSelect } from "../shadcn/native-select";

export type Range = "all" | "7d" | "30d" | "year";

const LABELS: Record<Range, string> = {
  all: "Semua waktu",
  "7d": "7 hari terakhir",
  "30d": "30 hari terakhir",
  year: "Tahun ini",
};

/** Start date of a range (null = no limit). */
export function rangeStart(range: Range): Date | null {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 86_400_000);
  if (range === "30d") return new Date(now.getTime() - 30 * 86_400_000);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

export function inRange(iso: string, range: Range) {
  const start = rangeStart(range);
  return !start || new Date(iso) >= start;
}

/**
 * The date-range chip: white with navy border and text. The select itself is the chip, with a minimum width that fits
 * the longest label (phones show selects at 16px, see globals.css). Light on purpose: some browsers draw a native
 * select's text in their own (black) colour, which was unreadable on the former navy chip.
 */
export function RangeSelect({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <label className={styles.rangeChip}>
      <IconCalendar className={styles.rangeIcon} />
      <span className="sr-only">Rentang waktu</span>
      <NativeSelect
        value={value}
        onChange={(e) => onChange(e.target.value as Range)}
        wrapperClassName="w-auto"
        className="h-10 min-w-[14.5rem] rounded-[14px] border-[1.5px] border-brand-navy bg-white pr-10 pl-12 text-[0.88rem] font-semibold text-brand-navy shadow-[var(--shadow)] [&>option]:text-foreground"
      >
        {(Object.keys(LABELS) as Range[]).map((r) => (
          <option key={r} value={r}>
            {LABELS[r]}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
