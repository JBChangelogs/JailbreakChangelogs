import React from "react";
import Image from "next/image";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TradeItem } from "@/types/trading";
import { handleImageError, isVideoItem, getVideoPath } from "@/utils/ui/images";
import TradeItemHoverTooltip from "./TradeItemHoverTooltip";
import {
  getTradeItemImagePath,
  isCustomTradeItem,
  tradeItemIdsEqual,
} from "@/utils/trading/tradeItems";

interface ItemGridProps {
  items: TradeItem[];
  title: string;
  showTitle?: boolean;
  onRemove?: (item: TradeItem) => void;
  disableInteraction?: boolean;
  variant?: "default" | "compact";
  onEmptyActivate?: () => void;
  emptyScrollTargetSelector?: string;
  emptyScrollOffsetPx?: number;
}

interface ItemWithData {
  data: TradeItem;
  id: number;
}

const getItemData = (item: TradeItem | ItemWithData): TradeItem => {
  if ("data" in item && item.data) {
    return {
      ...item.data,
      id: item.id,
      is_sub: false,
      tradable: item.data.tradable ? 1 : 0,
      is_limited: item.data.is_limited ?? 0,
      name: item.data.name, // Keep original name for image paths
      type: item.data.type,
      cash_value: item.data.cash_value,
      duped_value: item.data.duped_value,
    };
  }
  // If it's not an ItemWithData, it must be a TradeItem
  return item as TradeItem;
};

const getDisplayName = (item: TradeItem | ItemWithData): string => {
  if ("data" in item && item.data) {
    return item.data.name;
  }
  // If it's not an ItemWithData, it must be a TradeItem
  return (item as TradeItem).name;
};

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const itemData = getItemData(item);
      const key = `${item.id}:${item.isDuped ? 1 : 0}:${item.isOG ? 1 : 0}`;

      if (!acc[key]) {
        acc[key] = {
          ...itemData,
          count: 1,
          id: item.id,
        };
      } else {
        acc[key].count++;
      }
      return acc;
    },
    {} as Record<string, TradeItem & { count: number }>,
  );

  return Object.values(grouped);
};

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  title,
  showTitle = true,
  onRemove,
  disableInteraction = false,
  variant = "default",
  onEmptyActivate,
  emptyScrollTargetSelector = '[data-component="available-items-grid"]',
  emptyScrollOffsetPx = 140,
}) => {
  if (items.length === 0) {
    const isOffering = title.toLowerCase() === "offering";
    const borderColor = isOffering
      ? "border-status-success/30 hover:border-status-success/60"
      : "border-status-error/30 hover:border-status-error/60";

    const activateEmpty = () => {
      if (disableInteraction) return;
      onEmptyActivate?.();
      // Scroll after a short delay to ensure any tab switch completes.
      setTimeout(() => {
        const target = document.querySelector(emptyScrollTargetSelector);
        if (target) {
          const top =
            target.getBoundingClientRect().top +
            (window.scrollY || window.pageYOffset) -
            emptyScrollOffsetPx;
          window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
      }, 100);
    };

    return (
      <button
        type="button"
        className={`w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor} ${
          disableInteraction
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-secondary-bg cursor-pointer"
        }`}
        onClick={activateEmpty}
        onKeyDown={(e) => {
          if (disableInteraction) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activateEmpty();
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
      {showTitle ? (
        <h4 className="text-primary-text mb-2 text-sm">{title}</h4>
      ) : null}
      <div
        className="max-h-120 overflow-y-auto pr-1"
        aria-label="Selected items list"
      >
        <div
          className={
            variant === "compact"
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
              : "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
          }
        >
          {groupItems(items).map((item) => {
            const originalItem = items.find((i) =>
              tradeItemIdsEqual(i.id, item.id),
            );
            const displayName = originalItem
              ? getDisplayName(originalItem)
              : item.name;
            const shouldShowTooltip = !isCustomTradeItem(item);

            const content = (
              <button
                type="button"
                onClick={() => {
                  if (disableInteraction || !onRemove) return;
                  onRemove(item);
                }}
                className="block w-full text-left"
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
                        src={getTradeItemImagePath(item, true)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        draggable={false}
                        onError={handleImageError}
                      />
                    )}
                    {(item.count > 1 || item.isDuped || item.isOG) && (
                      <div className="absolute top-1 right-1 z-10 flex flex-col items-end gap-1">
                        {item.count > 1 && (
                          <div className="rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-xs leading-none font-semibold text-white shadow-sm backdrop-blur-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.95),0_0_4px_rgba(0,0,0,0.85)]">
                            ×{item.count}
                          </div>
                        )}
                        <div className="flex gap-1">
                          {item.isDuped && (
                            <span className="bg-status-error/90 text-form-button-text rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                              Duped
                            </span>
                          )}
                          {item.isOG && (
                            <span className="bg-tertiary-bg/80 text-primary-text rounded px-1 py-0.5 text-[9px] leading-none font-semibold">
                              OG
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Name */}
                <div className="mt-2 text-center">
                  <p className="text-primary-text hover:text-link line-clamp-2 text-xs font-medium transition-colors">
                    {displayName}
                  </p>
                </div>
              </button>
            );

            return (
              <div
                key={`${item.id}:${item.name}:${item.isDuped ? "duped" : "clean"}:${item.isOG ? "og" : "regular"}`}
                className={`group relative ${
                  disableInteraction
                    ? "cursor-not-allowed opacity-60"
                    : onRemove
                      ? "cursor-pointer"
                      : shouldShowTooltip
                        ? "cursor-help"
                        : "cursor-default"
                }`}
              >
                {shouldShowTooltip ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TradeItemHoverTooltip
                      item={{
                        ...item,
                        name: displayName,
                        base_name: originalItem?.data?.name || item.name,
                      }}
                    />
                  </Tooltip>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
