import React from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { TradeItem } from "@/types/trading";
import { handleImageError, isVideoItem, getVideoPath } from "@/utils/ui/images";
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
  onAdd?: (item: TradeItem) => void;
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

const parseTradeValue = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).trim().toLowerCase().replace(/,/g, "");
  if (!normalized || normalized === "n/a") return 0;
  if (normalized.endsWith("m")) {
    return (parseFloat(normalized.slice(0, -1)) || 0) * 1_000_000;
  }
  if (normalized.endsWith("k")) {
    return (parseFloat(normalized.slice(0, -1)) || 0) * 1_000;
  }
  return parseFloat(normalized) || 0;
};

const formatTradeValue = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString();
};

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  title,
  showTitle = true,
  onRemove,
  onAdd,
  disableInteraction = false,
  variant = "default",
  onEmptyActivate,
  emptyScrollTargetSelector = '[data-component="available-items-grid"]',
  emptyScrollOffsetPx = 140,
}) => {
  const isOffering = title.toLowerCase() === "offering";
  const borderColor = isOffering
    ? "border-status-success/30 hover:border-status-success/60"
    : "border-status-error/30 hover:border-status-error/60";

  const activateAdd = () => {
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

  if (items.length === 0) {
    return (
      <button
        type="button"
        className={`bg-tertiary-bg w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor} ${
          disableInteraction
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }`}
        onClick={activateAdd}
        onKeyDown={(e) => {
          if (disableInteraction) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activateAdd();
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
            const isCustom = isCustomTradeItem(item);

            const rawValue = item.isDuped ? item.duped_value : item.cash_value;
            const hasValue = rawValue != null && rawValue !== "N/A";
            const displayValue = hasValue
              ? formatTradeValue(parseTradeValue(rawValue) * item.count)
              : "N/A";

            const stepperButtonClass =
              "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/70 text-white transition-colors hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-40";

            const content = (
              <div className="block w-full text-left">
                {/* Image row */}
                <div className="relative">
                  <div
                    className={`relative aspect-video overflow-hidden rounded-lg ${
                      isCustom ? "bg-tertiary-bg" : ""
                    }`}
                  >
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
                  </div>
                  {/* Hover/focus reveal on devices with real hover; always shown on touch
                      (hover:none), since there's no hover gesture to reveal it there. */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 rounded-b-lg bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-has-[:focus-visible]:pointer-events-auto group-has-[:focus-visible]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (disableInteraction || !onRemove) return;
                        onRemove(item);
                      }}
                      disabled={disableInteraction || !onRemove}
                      className={stepperButtonClass}
                      aria-label={
                        item.count > 1
                          ? `Remove one ${displayName}`
                          : `Remove ${displayName}`
                      }
                    >
                      <Icon icon="heroicons:minus" className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 rounded-full bg-black/70 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                      {item.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (disableInteraction || !onAdd) return;
                        onAdd(item);
                      }}
                      disabled={disableInteraction || !onAdd}
                      className={stepperButtonClass}
                      aria-label={`Add another ${displayName}`}
                    >
                      <Icon icon="heroicons:plus" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name row */}
                <p className="text-primary-text mt-1.5 line-clamp-2 text-xs font-medium">
                  {displayName}
                </p>

                {/* Value row */}
                {!isCustom && (
                  <p className="text-primary-text mt-0.5 truncate text-sm font-bold">
                    {displayValue}
                    {item.count > 1 && (
                      <span className="text-secondary-text ml-1 text-xs font-semibold">
                        ×{item.count}
                      </span>
                    )}
                  </p>
                )}

                {/* Badge row */}
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {item.isOG ? (
                    <span className="bg-tertiary-bg text-primary-text inline-flex h-5 items-center justify-center rounded px-2 text-[10px] leading-none font-semibold">
                      OG
                    </span>
                  ) : (
                    <span
                      className={`inline-flex h-5 items-center justify-center rounded px-2 text-[10px] leading-none font-semibold ${
                        item.isDuped
                          ? "bg-status-error text-form-button-text"
                          : "bg-status-success text-form-button-text"
                      }`}
                    >
                      {item.isDuped ? "Duped" : "Clean"}
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={`${item.id}:${item.name}:${item.isDuped ? "duped" : "clean"}:${item.isOG ? "og" : "regular"}`}
                className={`group relative ${
                  disableInteraction ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                {content}
              </div>
            );
          })}

          {/* Persistent add slot — scrolls to the item picker below. */}
          <button
            type="button"
            onClick={activateAdd}
            disabled={disableInteraction}
            className={`border-border-card bg-tertiary-bg hover:border-border-focus flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors ${borderColor} ${
              disableInteraction
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }`}
            aria-label="Add another item"
          >
            <svg
              className="text-secondary-text/50 h-5 w-5"
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
            <span className="text-secondary-text/70 text-xs font-medium">
              Add item
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
