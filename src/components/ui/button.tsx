import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

/**
 * The one button of the product: a pill. Amber is for the main action only.
 * Hover lifts only on devices that can hover (Tailwind v4 wraps hover: in that media query).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border border-transparent font-semibold transition-[translate,scale,background-color,border-color,color] duration-200 ease-(--ease-out-soft) hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:border-amber-text",
        outline: "border-line-strong bg-g0/70 text-foreground hover:border-muted-foreground",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        destructive: "border-line-strong bg-g0/70 text-destructive hover:border-destructive",
        link: "rounded-md text-amber-text underline-offset-4 hover:translate-y-0 hover:underline",
      },
      size: {
        default: "h-11 px-[18px] md:h-[42px]",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11 md:size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
