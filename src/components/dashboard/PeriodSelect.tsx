"use client";

import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconCalendar } from "../Icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../shadcn/dropdown-menu";

export interface PeriodOption<T extends string | number> {
  value: T;
  label: string;
}

/**
 * The dashboards' time-period picker: a navy pill with an orange calendar badge and the chosen period, opening a
 * card of options (shadcn DropdownMenu). Not a native <select>, so it looks the same in every browser (some drew the
 * native select's text in black on the navy chip). Keyboard: Enter / Space opens, arrows move, Escape closes.
 */
export function PeriodSelect<T extends string | number>({
  value,
  options,
  onChange,
  label = "Periode",
  className,
}: {
  value: T;
  options: PeriodOption<T>[];
  onChange: (value: T) => void;
  /** Small caption above the value, and the menu's accessible name */
  label?: string;
  className?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`${label}: ${current.label}`}
        className={cn(
          "group inline-flex h-12 max-w-full items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 text-left text-white outline-none",
          "bg-gradient-to-r from-brand-navy to-[#1f5b96] shadow-[0_10px_24px_rgba(14,60,105,0.28)] ring-1 ring-white/10",
          "transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(14,60,105,0.36)]",
          "focus-visible:ring-[3px] focus-visible:ring-brand-orange/60 data-[state=open]:ring-2 data-[state=open]:ring-brand-orange/70",
          className,
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-orange shadow-[0_4px_10px_rgba(234,123,37,0.45)]">
          <IconCalendar className="size-[18px] text-white" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[0.62rem] font-semibold tracking-[0.14em] text-white/70 uppercase">{label}</span>
          <span className="truncate text-[0.92rem] font-semibold">{current.label}</span>
        </span>
        <ChevronDownIcon className="ml-1 size-4 shrink-0 opacity-80 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[max(var(--radix-dropdown-menu-trigger-width),14rem)] rounded-2xl border-black/5 p-1.5 shadow-[0_20px_45px_rgba(14,60,105,0.22)]"
      >
        <DropdownMenuLabel className="px-3 pt-2 pb-1 text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Pilih {label.toLowerCase()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-1" />
        <DropdownMenuRadioGroup value={String(value)} onValueChange={(v) => onChange(options.find((o) => String(o.value) === v)!.value)}>
          {options.map((o) => (
            <DropdownMenuRadioItem
              key={String(o.value)}
              value={String(o.value)}
              className={cn(
                "cursor-pointer rounded-xl py-2.5 pr-9 pl-3 text-[0.9rem] font-medium text-foreground",
                "data-[highlighted]:bg-brand-navy/[0.06] data-[state=checked]:bg-brand-orange/10 data-[state=checked]:text-brand-orange",
                "[&_svg]:text-brand-orange",
              )}
            >
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
