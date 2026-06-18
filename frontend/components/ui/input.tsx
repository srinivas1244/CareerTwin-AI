import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "field flex h-11 w-full rounded-xl border px-4 text-sm",
      "placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-brand/50 focus-visible:border-brand/40 transition",
      "disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
