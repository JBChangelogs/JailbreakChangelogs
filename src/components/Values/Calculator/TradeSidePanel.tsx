import React from "react";
import { TradeItem } from "@/types/trading";
import { Icon } from "../../ui/IconWrapper";
import { CalculatorItemGrid } from "./CalculatorItemGrid";
import { Button } from "../../ui/button";
import { TradeSideHeading } from "./TradeSideHeading";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

interface TradeSidePanelProps {
  side: "offering" | "requesting";
  items: TradeItem[];
  catalogItems: TradeItem[];
  useCatalogApi?: boolean;
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
  useCatalogApi = false,
  onRemoveItem,
  onDuplicateItem,
  onValueTypeChange,
  getSelectedValueType,
  getSelectedValue,
  onMirror,
}) => {
  const isOffering = side === "offering";
  const sideColor = isOffering ? "status-success" : "button-danger";

  return (
    <div
      className={`border-${sideColor} bg-secondary-bg flex-1 rounded-lg border p-4 transition-colors`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <TradeSideHeading
          side={side}
          count={items.length}
          total={items.reduce((sum, item) => sum + getSelectedValue(item), 0)}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" onClick={onMirror} size="sm">
              <Icon icon="heroicons:arrows-right-left" />
              Mirror
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Mirror to {isOffering ? "You receive" : "You give"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <CalculatorItemGrid
        items={items}
        catalogItems={catalogItems}
        useCatalogApi={useCatalogApi}
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
