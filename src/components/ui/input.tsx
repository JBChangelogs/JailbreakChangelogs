import * as React from "react";

import { cn } from "@/lib/utils";

/** A text field in the site's usual input style. */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text hover:border-border-focus focus:border-button-info h-10 w-full rounded-lg border px-3 text-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
