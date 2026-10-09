"use client";

import { PeriodSelect } from "./PeriodSelect";

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

/** The dashboards' date-range picker (PeriodSelect). */
export function RangeSelect({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <PeriodSelect
      label="Periode"
      value={value}
      onChange={onChange}
      options={(Object.keys(LABELS) as Range[]).map((r) => ({ value: r, label: LABELS[r] }))}
    />
  );
}
