import React from "react";
import { TradeItem } from "@/types/trading";
import { Icon } from "../../ui/IconWrapper";
import { CalculatorItemGrid } from "./CalculatorItemGrid";
import { Button } from "../../ui/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { SIDE_STYLES } from "./calculatorStyles";
import { NumberValue } from "./NumberValue";
import type { NumberDisplayMode } from "./calculatorUtils";

interface TradeSidePanelProps {
  side: "offering" | "requesting";
  items: TradeItem[];
  catalogItems: TradeItem[];
  useCatalogApi?: boolean;
  onRemoveItem: (instanceId: string) => void;
  onRemoveGroup?: (instanceIds: string[]) => void;
  onDuplicateItem: (item: TradeItem) => void;
  onValueTypeChange: (
    id: number,
    valueType: "cash" | "duped",
    instanceId?: string,
  ) => void;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
  getSelectedValue: (item: TradeItem) => number;
  onMirror: () => void;
  numberMode?: NumberDisplayMode;
  total?: number;
  onBrowse?: () => void;
}

export const TradeSidePanel: React.FC<TradeSidePanelProps> = ({
  side,
  items,
  catalogItems,
  useCatalogApi = false,
  onRemoveItem,
  onRemoveGroup,
  onDuplicateItem,
  onValueTypeChange,
  getSelectedValueType,
  getSelectedValue,
  onMirror,
  numberMode = "short",
  total = 0,
  onBrowse,
}) => {
  const isOffering = side === "offering";
  const sideStyle = SIDE_STYLES[side];

  return (
    <div
      className={`bg-secondary-bg relative flex-1 overflow-hidden rounded-lg border p-4 ${sideStyle.panelBorder}`}
    >
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${sideStyle.iconChip}`}
          >
            <Icon
              icon={sideStyle.icon}
              className="h-4 w-4"
              aria-hidden="true"
            />
          </span>
          <h3 className="text-primary-text text-xs font-semibold tracking-wide uppercase">
            {sideStyle.label}
          </h3>
          <span className="text-secondary-text text-sm tabular-nums">
            · {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          <span className="text-primary-text text-sm font-bold">
            <span className="sr-only">Subtotal: </span>
            <NumberValue value={total} mode={numberMode} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                onClick={onMirror}
                size="sm"
                className="pointer-coarse:h-10!"
              >
                <Icon icon="heroicons:arrows-right-left" />
                Mirror
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Mirror to {isOffering ? "You receive" : "You give"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="relative">
        <CalculatorItemGrid
          items={items}
          catalogItems={catalogItems}
          useCatalogApi={useCatalogApi}
          onRemove={onRemoveItem}
          onRemoveGroup={onRemoveGroup}
          onDuplicate={onDuplicateItem}
          onValueTypeChange={onValueTypeChange}
          getSelectedValueType={getSelectedValueType}
          getSelectedValue={getSelectedValue}
          side={side}
          numberMode={numberMode}
          onBrowse={onBrowse}
        />
      </div>
    </div>
  );
};
