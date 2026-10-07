import React from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TradeSideActions({
  hasItems,
  onSwapSides,
  onClearSides,
}: {
  hasItems: boolean;
  onSwapSides: () => void;
  onClearSides: (event?: React.MouseEvent) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Actions for both trade sides"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={hasItems ? onSwapSides : undefined}
            aria-disabled={!hasItems}
            tabIndex={hasItems ? undefined : -1}
            className={!hasItems ? "pointer-events-none opacity-50" : undefined}
          >
            <Icon icon="heroicons:arrows-right-left" />
            Swap
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Swap both trade sides</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={hasItems ? onClearSides : undefined}
            aria-disabled={!hasItems}
            tabIndex={hasItems ? undefined : -1}
            className={!hasItems ? "pointer-events-none opacity-50" : undefined}
          >
            <Icon icon="heroicons-outline:trash" />
            Clear trade
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Clear items (hold Shift to clear both sides instantly)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
