import { cn } from "@/lib/utils"

/** shadcn/ui Skeleton: a pulsing grey block standing in for content that is still loading */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-[#e3e3e3]", className)} {...props} />
}

export { Skeleton }
