import * as React from "react";
import { cn } from "@/lib/utils";

/** Text, number and date fields: a visible 3:1 border on the dark page and an amber focus ring. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-input bg-g0/55 px-3.5 text-base text-foreground transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:h-11 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
