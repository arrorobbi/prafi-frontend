import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  // A row (optional icon + content) rather than shadcn's grid, so plain text and any markup fit
  "relative flex w-full items-start gap-3 rounded-[20px] border px-5 py-4 text-[0.88rem] leading-normal [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:translate-y-px [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#e3effa] text-brand-navy",
        info: "border-transparent bg-[#e3effa] text-brand-navy",
        success: "border-transparent bg-[#dcf7e8] text-[#0b5a31]",
        warning: "border-transparent bg-[#fbe9a0] text-[#2b2100]",
        destructive: "border-transparent bg-[#ffe1e1] text-[#7a0b0b]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
