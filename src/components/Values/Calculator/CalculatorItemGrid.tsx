import React from "react";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import { getItemImagePath, handleImageError } from "@/utils/images";
import TradeItemHoverTooltip from "../../trading/TradeItemHoverTooltip";

import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";

interface CalculatorItemGridProps {
  items: TradeItem[];
  onRemove?: (instanceId: string) => void;
  onValueTypeChange?: (
    itemId: number,
    valueType: "cash" | "duped",
    instanceId?: string,
  ) => void;
  getSelectedValueString?: (item: TradeItem) => string;
  getSelectedValueType?: (item: TradeItem) => "cash" | "duped";
  side?: "offering" | "requesting";
}

export const CalculatorItemGrid: React.FC<CalculatorItemGridProps> = ({
  items,
  onRemove,
  side,
}) => {
  if (items.length === 0) {
    const handleClick = () => {
      // Switch to items tab
      if (typeof window !== "undefined") {
        window.location.hash = "";
      }
      // Scroll to items grid after a short delay to ensure tab switch completes
      setTimeout(() => {
        const target =
          document.querySelector('[data-component="scan-trade-from-image"]') ??
          document.querySelector('[data-component="trade-item-picker-v2"]');
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    };

    const isOffering = side === "offering";
    const borderColor = isOffering
      ? "border-status-success/30 hover:border-status-success/60"
      : "border-status-error/30 hover:border-status-error/60";

    return (
      <div
        className={`border-border-card bg-tertiary-bg hover:border-border-focus cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="mb-2">
          <svg
            className="text-secondary-text/50 mx-auto h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <p className="text-secondary-text text-sm font-medium">
          No items selected
        </p>
        <p className="text-secondary-text/60 mt-1 text-xs">
          Browse items or drop items here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4">
      <div
        className="max-h-[480px] overflow-y-auto pr-1"
        aria-label="Selected items list"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const displayName = item.name;
            const isDupedSelected = !!item.isDuped;

            return (
              <div key={item.instanceId} className="group relative">
                {/* Item Image Container - Click to Remove */}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div
                      className="relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRemove && item.instanceId) {
                          onRemove(item.instanceId);
                        }
                      }}
                    >
                      <Image
                        src={getItemImagePath(item.type, item.name, true)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        draggable={false}
                        onError={handleImageError}
                      />
                      {isDupedSelected && (
                        <div className="absolute top-1 right-1 z-10 flex flex-col items-end gap-1">
                          <span className="bg-status-error/90 text-form-button-text rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                            Duped
                          </span>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TradeItemHoverTooltip
                    side="right"
                    item={{
                      ...item,
                      name: displayName,
                      base_name: item.base_name || item.name,
                    }}
                  />
                </Tooltip>

                {/* Item Name */}
                <div className="mt-2 text-center">
                  <p className="text-primary-text line-clamp-2 text-xs font-medium">
                    {displayName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
