import * as React from "react";
import { TooltipContent } from "@/components/ui/tooltip";
import { TradeItem } from "@/types/trading";
import { TradeAdTooltip } from "./TradeAdTooltip";

interface TradeItemHoverTooltipProps {
  item: TradeItem;
  side?: React.ComponentPropsWithoutRef<typeof TooltipContent>["side"];
}

export default function TradeItemHoverTooltip({
  item,
  side = "top",
}: TradeItemHoverTooltipProps) {
  return (
    <TooltipContent side={side} className="max-w-sm min-w-[300px] p-0">
      <TradeAdTooltip item={item} />
    </TooltipContent>
  );
}
