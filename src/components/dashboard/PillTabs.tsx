"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "../shadcn/tabs";

export interface PillTab<T extends string> {
  value: T;
  label: React.ReactNode;
}

/** A small count badge inside a tab label: navy on an inactive tab, white on the active (orange) one */
export const PILL_COUNT =
  "ml-1.5 inline-block min-w-5 rounded-full bg-brand-navy px-1.5 text-center text-[0.72rem] leading-5 font-bold text-white group-data-[state=active]/tab:bg-white group-data-[state=active]/tab:text-brand-orange";

/** Radix tabs can't hold an empty value; "" (e.g. "Semua") is mapped to this internally */
const ALL = "__all";

/**
 * The dashboards' filter tabs (white pills with navy text, the active one orange), built on the shadcn Tabs: arrow
 * keys move between tabs. Only the bar; each page renders its own content for the selected value. A count inside a
 * label can use `PILL_COUNT` so it stays readable on both.
 */
export function PillTabs<T extends string>({
  value,
  onChange,
  items,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  items: PillTab<T>[];
  /** Accessible name of the tab bar */
  label: string;
  className?: string;
}) {
  return (
    <Tabs value={value || ALL} onValueChange={(v) => onChange((v === ALL ? "" : v) as T)}>
      {/* shadcn's list is a fixed 36px high; auto, so wrapped rows (phones) push the content down instead of covering it */}
      <TabsList
        aria-label={label}
        className={cn("mb-3.5 h-auto w-full flex-wrap justify-start gap-2.5 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto", className)}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value || ALL}
            value={item.value || ALL}
            className={cn(
              // Inactive: white with navy text and border; active: solid orange. `group/tab` lets a count badge follow it
              "group/tab h-auto min-w-[140px] flex-none rounded-full border-[1.5px] border-brand-navy/25 bg-white px-4 py-2 text-[0.85rem] font-semibold text-brand-navy shadow-sm",
              "transition-colors hover:border-brand-navy/50 hover:bg-brand-navy/5 hover:text-brand-navy",
              "data-[state=active]:border-brand-orange data-[state=active]:bg-brand-orange data-[state=active]:text-white data-[state=active]:shadow-md",
              // Phones: up to 3 tabs share one row, more wrap two per row
              items.length <= 3 ? "max-sm:min-w-0 max-sm:flex-1 max-sm:px-2" : "max-sm:min-w-0 max-sm:flex-[1_1_calc(50%-10px)] max-sm:px-3",
            )}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
