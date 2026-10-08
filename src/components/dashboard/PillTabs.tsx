"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "../shadcn/tabs";

export interface PillTab<T extends string> {
  value: T;
  label: React.ReactNode;
}

/** Radix tabs can't hold an empty value; "" (e.g. "Semua") is mapped to this internally */
const ALL = "__all";

/**
 * The dashboards' filter tabs (navy pills, the active one orange), built on the shadcn Tabs: arrow keys move
 * between tabs. Only the bar; each page renders its own content for the selected value.
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
      <TabsList aria-label={label} className={cn("mb-3.5 h-auto flex-wrap justify-start gap-2.5 bg-transparent p-0", className)}>
        {items.map((item) => (
          <TabsTrigger
            key={item.value || ALL}
            value={item.value || ALL}
            className={cn(
              "h-auto min-w-[140px] flex-none rounded-full border-0 bg-brand-navy px-4 py-1.5 text-[0.82rem] font-normal text-white hover:text-white",
              "data-[state=active]:bg-brand-orange data-[state=active]:font-bold data-[state=active]:text-white data-[state=active]:shadow-none",
              "max-sm:min-w-0 max-sm:flex-[1_1_calc(50%-10px)]",
            )}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
