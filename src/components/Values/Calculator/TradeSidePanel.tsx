import React from "react";
import { TradeItem } from "@/types/trading";
import { Button } from "@mui/material";
import dynamic from "next/dynamic";
import { DroppableZone } from "@/components/dnd/DroppableZone";
import { Icon } from "../../ui/IconWrapper";
import { CalculatorItemGrid } from "./CalculatorItemGrid";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface TradeSidePanelProps {
  side: "offering" | "requesting";
  items: TradeItem[];
  onRemoveItem: (instanceId: string) => void;
  onValueTypeChange: (
    id: number,
    subName: string | undefined,
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
        <Tooltip
          title={`Mirror to ${isOffering ? "requesting" : "offering"}`}
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                backgroundColor: "var(--color-secondary-bg)",
                color: "var(--color-primary-text)",
                "& .MuiTooltip-arrow": {
                  color: "var(--color-secondary-bg)",
                },
              },
            },
          }}
        >
          <Button
            variant="outlined"
            onClick={onMirror}
            size="small"
            className={`bg-${sideColor}/15 hover:bg-${sideColor}/25 border-${sideColor} text-primary-text hover:border-${sideColor}`}
          >
            <Icon icon="heroicons:arrows-right-left" className="mr-1 h-4 w-4" />
            Mirror
          </Button>
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
