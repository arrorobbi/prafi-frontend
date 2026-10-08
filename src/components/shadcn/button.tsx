import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * shadcn Button in Trans Niaga colours. Variants match the site's palette (navy, orange, green, red, blue, light,
 * white) plus round icon buttons; the default shape is a pill, `shape="square"` gives the uppercase square look.
 */
const buttonVariants = cva(
  // "btn-ui": a stable hook for page layout rules (width, alignment), never for colours
  "btn-ui inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-semibold whitespace-nowrap transition-[filter,transform,box-shadow] outline-none hover:brightness-[1.07] active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "bg-brand-navy text-white",
        navy: "bg-brand-navy text-white",
        orange: "bg-brand-orange text-white",
        green: "bg-brand-green text-white",
        red: "bg-destructive text-white",
        blue: "bg-[#7fcfe8] text-foreground",
        light: "bg-[#e3e3e3] text-foreground",
        white: "bg-white text-brand-navy",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-white",
        /** Round icon buttons (✔ / ✖ / pencil / trash in tables) */
        icon: "bg-[#d9d9d9] text-foreground",
        "icon-green": "bg-[#6edb9f] text-foreground",
        "icon-red": "bg-[#ff8f8f] text-foreground",
        "icon-yellow": "bg-[#fbe9a0] text-foreground",
      },
      size: {
        default: "min-h-10 px-[22px] py-2 text-[0.92rem] leading-tight",
        sm: "min-h-8 px-3.5 py-1 text-[0.8rem] leading-tight",
        lg: "min-h-[50px] px-7 py-2.5 text-[1.05rem] leading-tight",
        icon: "size-9 rounded-full p-0",
      },
      shape: {
        pill: "rounded-full",
        square: "rounded-md uppercase tracking-[0.02em]",
      },
    },
    compoundVariants: [{ size: "icon", className: "rounded-full" }],
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "pill",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
