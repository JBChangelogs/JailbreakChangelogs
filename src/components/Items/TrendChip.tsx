"use client";

import { useRef, useState } from "react";
import { getTrendColor } from "@/utils/items/badgeColors";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Trend chip whose meaning shows on hover, or on tap for touch screens
// (Radix tooltips ignore touch, so taps toggle it manually).
export function TrendChip({
  trend,
  description,
  className,
}: {
  trend: string;
  description: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const tap = useRef({ touch: false, wasOpen: false });
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          className={cn(getTrendColor(trend), className, "cursor-help")}
          onPointerDown={(e) => {
            // Radix closes on pointerdown, so remember the state before it.
            tap.current = { touch: e.pointerType === "touch", wasOpen: open };
          }}
          onClick={(e) => {
            if (!tap.current.touch) return;
            e.preventDefault(); // skips Radix's close-on-click
            e.stopPropagation(); // don't also select the row/card behind it
            setOpen(!tap.current.wasOpen);
          }}
        >
          {trend}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs space-y-1.5">
        <span
          className={cn(
            getTrendColor(trend),
            "inline-flex rounded-md px-1.5 py-0.5 font-bold",
          )}
        >
          {trend}
        </span>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
