import React from "react";
import { TradeItem } from "@/types/trading";
import { DroppableZone } from "@/components/dnd/DroppableZone";
import { Icon } from "../../ui/IconWrapper";
import { CalculatorItemGrid } from "./CalculatorItemGrid";
import { Button } from "../../ui/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";

interface TradeSidePanelProps {
  side: "offering" | "requesting";
  items: TradeItem[];
  onRemoveItem: (instanceId: string) => void;
  onValueTypeChange: (
    id: number,
    valueType: "cash" | "duped",
    instanceId?: string,
  ) => void;
  getSelectedValueString: (item: TradeItem) => string;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
  onMirror: () => void;
  totals: {
    cashValue: string;
    breakdown: {
      clean: { count: number; formatted: string };
      duped: { count: number; formatted: string };
    };
  };
}

export const TradeSidePanel: React.FC<TradeSidePanelProps> = ({
  side,
  items,
  onRemoveItem,
  onValueTypeChange,
  getSelectedValueString,
  getSelectedValueType,
  onMirror,
  totals,
}) => {
  const isOffering = side === "offering";
  const sideColor = isOffering ? "status-success" : "status-error";
  const sideLabel = isOffering ? "Offering" : "Requesting";
  const dropZoneId = `${side}-drop-zone`;

  return (
    <DroppableZone
      id={dropZoneId}
      className={`border-${sideColor} bg-secondary-bg flex-1 rounded-lg border p-4 transition-colors`}
      activeClassName={`border-${sideColor}/80 bg-${sideColor}/5 ring-2 ring-${sideColor}/50`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-secondary-text font-medium">{sideLabel}</h3>
          <span className="text-secondary-text/70 text-sm">
            ({items.length})
          </span>
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
        onRemove={onRemoveItem}
        onValueTypeChange={onValueTypeChange}
        getSelectedValueString={getSelectedValueString}
        getSelectedValueType={getSelectedValueType}
        side={side}
      />
      <div className="text-secondary-text/70 mt-4 flex flex-col flex-wrap items-start gap-2 text-xs sm:flex-row sm:items-center sm:gap-3 sm:text-sm">
        <span>
          Total:{" "}
          <span className="text-secondary-text font-bold">
            {totals.cashValue}
          </span>
        </span>
        <span className="border-status-success/20 bg-status-success/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
          {totals.breakdown.clean.count} clean •{" "}
          {totals.breakdown.clean.formatted}
        </span>
        <span className="border-status-error/20 bg-status-error/80 text-form-button-text inline-flex items-center rounded-full border px-2 py-0.5">
          {totals.breakdown.duped.count} duped •{" "}
          {totals.breakdown.duped.formatted}
        </span>
      </div>
    </DroppableZone>
  );
};
