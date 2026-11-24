import * as React from "react";
import { TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TradeItem } from "@/types/trading";
import { TradeAdTooltip } from "./TradeAdTooltip";

interface TradeItemHoverTooltipProps {
  item: TradeItem;
  side?: React.ComponentPropsWithoutRef<typeof TooltipContent>["side"];
  className?: string;
}

export default function TradeItemHoverTooltip({
  item,
  side = "top",
  className,
}: TradeItemHoverTooltipProps) {
  return (
    <TooltipContent
      side={side}
      className={cn("max-w-sm min-w-75 p-0", className)}
    >
      <TradeAdTooltip item={item} />
    </TooltipContent>
  );
}
