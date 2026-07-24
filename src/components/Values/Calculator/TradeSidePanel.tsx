import React from "react";
import { TradeItem } from "@/types/trading";
import { Icon } from "../../ui/IconWrapper";
import { CalculatorItemGrid } from "./CalculatorItemGrid";
import { Button } from "../../ui/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

interface TradeSidePanelProps {
  side: "offering" | "requesting";
  items: TradeItem[];
  catalogItems: TradeItem[];
  onRemoveItem: (instanceId: string) => void;
  onDuplicateItem: (item: TradeItem) => void;
  onValueTypeChange: (
    id: number,
    valueType: "cash" | "duped",
    instanceId?: string,
  ) => void;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
  getSelectedValue: (item: TradeItem) => number;
  onMirror: () => void;
}

export const TradeSidePanel: React.FC<TradeSidePanelProps> = ({
  side,
  items,
  catalogItems,
  onRemoveItem,
  onDuplicateItem,
  onValueTypeChange,
  getSelectedValueType,
  getSelectedValue,
  onMirror,
}) => {
  const isOffering = side === "offering";
  const sideColor = isOffering ? "status-success" : "status-error";
  const sideLabel = isOffering ? "Offering" : "Requesting";

  return (
    <div
      className={`border-${sideColor} bg-secondary-bg flex-1 rounded-lg border p-4 transition-colors`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3
            className={`text-${sideColor} text-xs font-medium tracking-wide uppercase`}
          >
            {sideLabel}
          </h3>
          <span className="text-secondary-text text-sm">({items.length})</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" onClick={onMirror} size="sm">
              <Icon icon="heroicons:arrows-right-left" />
              Mirror
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Mirror to {isOffering ? "requesting" : "offering"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <CalculatorItemGrid
        items={items}
        catalogItems={catalogItems}
        onRemove={onRemoveItem}
        onDuplicate={onDuplicateItem}
        onValueTypeChange={onValueTypeChange}
        getSelectedValueType={getSelectedValueType}
        getSelectedValue={getSelectedValue}
        side={side}
      />
    </div>
  );
};
