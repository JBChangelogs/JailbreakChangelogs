import React from "react";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import TradeItemHoverTooltip from "../../trading/TradeItemHoverTooltip";
import { isCustomTradeItem } from "@/utils/trading/tradeItems";

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
  onEmptyActivate?: () => void;
  emptyScrollTargetSelector?: string;
  emptyScrollOffsetPx?: number;
}

export const CalculatorItemGrid: React.FC<CalculatorItemGridProps> = ({
  items,
  onRemove,
  side,
  onEmptyActivate,
  emptyScrollTargetSelector,
  emptyScrollOffsetPx = 140,
}) => {
  if (items.length === 0) {
    const handleClick = () => {
      onEmptyActivate?.();

      const selector =
        emptyScrollTargetSelector ??
        '[data-component="calculator-items-panel"]';

      // Scroll after a short delay to ensure any tab switch completes.
      setTimeout(() => {
        const target =
          document.querySelector(selector) ??
          document.querySelector('[data-component="scan-trade-from-image"]') ??
          document.querySelector('[data-component="trade-item-picker-v2"]');
        if (!target) return;
        const top =
          target.getBoundingClientRect().top +
          (window.scrollY || window.pageYOffset) -
          emptyScrollOffsetPx;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }, 100);
    };

    const isOffering = side === "offering";
    const borderColor = isOffering
      ? "border-status-success/30 hover:border-status-success/60"
      : "border-status-error/30 hover:border-status-error/60";

    return (
      <button
        type="button"
        className={`border-border-card bg-tertiary-bg hover:border-border-focus w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor}`}
        onClick={handleClick}
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
        <p className="text-secondary-text/70 mt-1 text-xs">Browse items here</p>
      </button>
    );
  }

  return (
    <div className="rounded-lg p-4">
      <div
        className="max-h-120 overflow-y-auto pr-1"
        aria-label="Selected items list"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const displayName = item.name;
            const isDupedSelected = !!item.isDuped;
            // Calculator assigns a random alphanumeric instanceId; that must not mark items as "custom" for images/tooltips.
            const itemForTradeChecks: TradeItem = {
              ...item,
              instanceId: undefined,
            };
            const shouldShowTooltip = !isCustomTradeItem(itemForTradeChecks);

            const media = (
              <button
                type="button"
                className="block w-full cursor-pointer text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemove && item.instanceId) {
                    onRemove(item.instanceId);
                  }
                }}
              >
                <div className="relative aspect-square">
                  <div className="relative h-full w-full overflow-hidden rounded-lg">
                    {isVideoItem(item.name) ? (
                      <video
                        src={getVideoPath(item.type, item.name)}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : (
                      <Image
                        src={getItemImagePath(
                          item.type,
                          item.base_name || item.name,
                          true,
                        )}
                        alt={item.name}
                        fill
                        className="object-cover"
                        draggable={false}
                        onError={handleImageError}
                      />
                    )}
                    {isDupedSelected && (
                      <div className="absolute top-1 right-1 z-10 flex flex-col items-end gap-1">
                        <span className="bg-status-error/90 text-form-button-text rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                          Duped
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );

            return (
              <div key={item.instanceId} className="group relative">
                {shouldShowTooltip ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{media}</TooltipTrigger>
                    <TradeItemHoverTooltip
                      item={{
                        ...item,
                        name: displayName,
                        base_name: item.base_name || item.name,
                      }}
                    />
                  </Tooltip>
                ) : (
                  media
                )}

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
