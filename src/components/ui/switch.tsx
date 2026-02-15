"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, style, checked, ...props }, ref) => {
  const hasControlledChecked = typeof checked === "boolean";
  const rootStyle = hasControlledChecked
    ? {
        ...style,
        backgroundColor: checked
          ? "var(--color-button-info)"
          : "color-mix(in srgb, var(--color-tertiary-bg), white 8%)",
        borderColor: checked
          ? "var(--color-button-info)"
          : "color-mix(in srgb, var(--color-border-card), white 10%)",
      }
    : style;

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-secondary-bg)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--color-button-info)] data-[state=checked]:bg-[var(--color-button-info)] data-[state=unchecked]:border-[color-mix(in_srgb,var(--color-border-card),white_10%)] data-[state=unchecked]:bg-[color-mix(in_srgb,var(--color-tertiary-bg),white_8%)]",
        className,
      )}
      checked={checked}
      style={rootStyle}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1",
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
