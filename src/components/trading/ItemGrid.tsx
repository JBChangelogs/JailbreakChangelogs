import React from "react";
import Image from "next/image";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TradeItem } from "@/types/trading";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/images";
import TradeItemHoverTooltip from "./TradeItemHoverTooltip";

interface ItemGridProps {
  items: TradeItem[];
  title: string;
  onRemove?: (itemId: number) => void;
  disableInteraction?: boolean;
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
      const key = `${item.id}`;

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
  onRemove,
  disableInteraction = false,
}) => {
  if (items.length === 0) {
    const isOffering = title.toLowerCase() === "offering";
    const borderColor = isOffering
      ? "border-status-success/30 hover:border-status-success/60"
      : "border-status-error/30 hover:border-status-error/60";

    return (
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor} ${
          disableInteraction
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-secondary-bg cursor-pointer"
        }`}
        onClick={() => {
          if (disableInteraction) return;
          // Scroll to items grid after a short delay to ensure tab switch completes
          setTimeout(() => {
            const itemsGrid = document.querySelector(
              '[data-component="available-items-grid"]',
            );
            if (itemsGrid) {
              itemsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (disableInteraction) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // Scroll to items grid after a short delay to ensure tab switch completes
            setTimeout(() => {
              const itemsGrid = document.querySelector(
                '[data-component="available-items-grid"]',
              );
              if (itemsGrid) {
                itemsGrid.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 100);
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
        <p className="text-secondary-text/70 mt-1 text-xs">
          Browse items or drop items here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4">
      <h4 className="text-primary-text mb-2 text-sm">{title}</h4>
      <div
        className="max-h-[480px] overflow-y-auto pr-1"
        aria-label="Selected items list"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {groupItems(items).map((item) => {
            const originalItem = items.find((i) => i.id === item.id);
            const displayName = originalItem
              ? getDisplayName(originalItem)
              : item.name;

            return (
              <div
                key={`${item.id}`}
                className={`group relative ${
                  disableInteraction
                    ? "cursor-not-allowed opacity-60"
                    : onRemove
                      ? "cursor-pointer"
                      : "cursor-help"
                }`}
              >
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => {
                        if (disableInteraction || !onRemove) return;
                        onRemove(item.id);
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
                              src={getItemImagePath(item.type, item.name, true)}
                              alt={item.name}
                              fill
                              className="object-cover"
                              onError={handleImageError}
                            />
                          )}
                          {item.count > 1 && (
                            <div className="bg-button-info/90 border-button-info text-form-button-text absolute top-1 right-1 z-5 rounded-full border px-1.5 py-0.5 text-xs">
                              ×{item.count}
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
                    </div>
                  </TooltipTrigger>
                  <TradeItemHoverTooltip
                    item={{
                      ...item,
                      name: displayName,
                      base_name: originalItem?.data?.name || item.name,
                    }}
                  />
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
