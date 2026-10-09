"use client";

import { useRealtimeStatus } from "@/lib/realtime";
import { cn } from "@/lib/utils";

/** "● Live" while the page receives updates over Socket.IO, "○ Offline" while the connection is down */
export function LiveBadge({ className }: { className?: string }) {
  const live = useRealtimeStatus();
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[0.78rem] font-bold",
        live ? "bg-[#e3f8ec] text-[#11804a]" : "bg-[#e3e3e3] text-[#4a4a4a]",
        className,
      )}
      title={live ? "Halaman ini diperbarui otomatis" : "Pembaruan otomatis terputus; muat ulang halaman bila perlu"}
    >
      {live ? "● Live" : "○ Offline"}
    </span>
  );
}
