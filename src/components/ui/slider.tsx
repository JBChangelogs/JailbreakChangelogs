"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none items-center select-none",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="bg-tertiary-bg relative h-1.5 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-button-info absolute h-full" />
    </SliderPrimitive.Track>
    {Array.from({
      length: props.value?.length || props.defaultValue?.length || 1,
    }).map((_, i) => (
      <SliderPrimitive.Thumb
        key={i}
        className="border-button-info bg-primary-bg focus-visible:ring-border-focus block h-5 w-5 rounded-full border-2 shadow-md transition-all hover:scale-110 focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
