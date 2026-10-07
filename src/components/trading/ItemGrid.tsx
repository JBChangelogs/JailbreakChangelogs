import { ItemUnlockBadges } from "@/components/Items/ItemUnlockBadges";
import { isSeasonalItem } from "@/utils/items/season";
import React from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { TradeItem } from "@/types/trading";
import { handleImageError, isVideoItem, getVideoPath } from "@/utils/ui/images";
import {
  getTradeItemImagePath,
  isCustomTradeItem,
} from "@/utils/trading/tradeItems";
import { TradeItemMarketDetails, TradeItemNote } from "./TradeItemContext";
import { QuickAddPopover } from "./QuickAddPopover";
import { DupedBadge } from "./DupedBadge";
import { OgBadge } from "./OgBadge";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";

interface ItemGridProps {
  items: TradeItem[];
  title: string;
  showTitle?: boolean;
  onRemove?: (item: TradeItem) => void;
  onRemoveAll?: (item: TradeItem) => void;
  onAdd?: (item: TradeItem) => void;
  clickToRemove?: boolean;
  disableInteraction?: boolean;
  variant?: "default" | "compact";
  onEmptyActivate?: () => void;
  quickAddItems?: TradeItem[];
  quickAddUseCatalogApi?: boolean;
  onQuickAdd?: (item: TradeItem) => void;
  emptyScrollTargetSelector?: string;
  emptyScrollOffsetPx?: number;
}

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const key = `${item.id}:${item.isDuped ? 1 : 0}:${item.isOG ? 1 : 0}`;

      if (!acc[key]) {
        acc[key] = {
          ...item,
          count: 1,
          id: item.id,
          isDuped: item.isDuped,
          isOG: item.isOG,
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
  onRemoveAll,
  onAdd,
  clickToRemove = false,
  disableInteraction = false,
  variant = "default",
  onEmptyActivate,
  quickAddItems = [],
  quickAddUseCatalogApi = false,
  onQuickAdd,
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

  const renderAddControl = (button: React.ReactNode) =>
    onQuickAdd ? (
      <QuickAddPopover
        items={quickAddItems}
        useCatalogApi={quickAddUseCatalogApi}
        allowOg
        onSelect={onQuickAdd}
      >
        {button}
      </QuickAddPopover>
    ) : (
      button
    );

  if (items.length === 0) {
    return renderAddControl(
      <button
        type="button"
        className={`bg-tertiary-bg w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor} ${
          disableInteraction
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        }`}
        onClick={onQuickAdd ? undefined : activateAdd}
        disabled={disableInteraction}
        onKeyDown={(e) => {
          if (disableInteraction || onQuickAdd) return;
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
        <p className="text-secondary-text/70 mt-1 text-xs">
          {onQuickAdd ? "Search for an item to add it" : "Browse items here"}
        </p>
      </button>,
    );
  }

  return (
    <div className="rounded-lg">
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
              : "grid grid-cols-2 gap-3 md:grid-cols-3"
          }
        >
          {groupItems(items).map((item) => {
            const displayName = item.name;
            const isCustom = isCustomTradeItem(item);

            const rawValue = item.isDuped ? item.duped_value : item.cash_value;
            const hasValue = rawValue != null && rawValue !== "N/A";
            const displayValue = hasValue
              ? formatTradeValue(parseTradeValue(rawValue))
              : "N/A";

            const stepperButtonClass =
              "text-primary-text hover:bg-quaternary-bg focus-visible:outline-border-focus flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2";

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
                  {!isCustom && (
                    <ItemUnlockBadges season={item.season} level={item.level} />
                  )}
                  {!isCustom && (
                    <div className="pointer-events-none absolute top-1.5 right-1.5 z-10">
                      <CategoryIconBadge
                        type={item.type}
                        isLimited={item.is_limited === 1}
                        isSeasonal={isSeasonalItem(item)}
                        withContainer={false}
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className="text-primary-text min-w-0 truncate text-xs font-semibold"
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    {!isCustom && (
                      <span className="relative z-20">
                        <TradeItemNote item={item} name={displayName} />
                      </span>
                    )}
                  </div>

                  {!isCustom && (
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-primary-text text-sm font-bold tabular-nums">
                        {displayValue}
                        {item.count > 1 && (
                          <span className="text-secondary-text ml-1 text-[10px] font-semibold">
                            ×{item.count}
                          </span>
                        )}
                      </p>
                      {item.isDuped ? (
                        <DupedBadge compact />
                      ) : item.isOG ? (
                        <OgBadge compact />
                      ) : (
                        <span className="bg-status-success text-form-button-text inline-flex h-5 items-center justify-center rounded-md px-2 text-[10px] leading-none font-semibold">
                          Clean
                        </span>
                      )}
                    </div>
                  )}
                  <div className="relative z-20 flex items-center justify-between gap-2">
                    <div className="border-border-card inline-flex items-center rounded-full border">
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
                      <span className="text-primary-text min-w-5 text-center text-xs font-bold tabular-nums">
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
                    {onRemoveAll && (
                      <button
                        type="button"
                        disabled={disableInteraction}
                        onClick={() => onRemoveAll(item)}
                        aria-label={`Remove all ${item.count} ${displayName}`}
                        className="text-button-danger hover:bg-button-danger/10 focus-visible:outline-border-focus relative z-20 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Icon
                          icon="heroicons-outline:trash"
                          className="h-4 w-4"
                        />
                      </button>
                    )}
                  </div>
                  {!isCustom && (
                    <TradeItemMarketDetails
                      item={item}
                      isDuped={item.isDuped}
                    />
                  )}
                </div>
              </div>
            );

            return (
              <div
                key={`${item.id}:${item.name}:${item.isDuped ? "duped" : "clean"}:${item.isOG ? "og" : "regular"}`}
                className={`group border-border-card bg-tertiary-bg/50 relative rounded-xl border p-2.5 ${
                  disableInteraction ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                {clickToRemove && onRemove && !onRemoveAll && (
                  <button
                    type="button"
                    onClick={() => onRemove(item)}
                    disabled={disableInteraction}
                    aria-label={
                      item.count > 1
                        ? `Remove one ${displayName}`
                        : `Remove ${displayName}`
                    }
                    className="group/remove focus-visible:outline-status-error absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
                  >
                    <span className="pointer-events-none absolute inset-x-2.5 top-2.5 flex aspect-video items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover/remove:opacity-100 group-focus-visible/remove:opacity-100">
                      <span className="bg-status-error/90 flex h-11 w-11 items-center justify-center rounded-full text-white">
                        <Icon icon="heroicons:x-mark" className="h-6 w-6" />
                      </span>
                    </span>
                  </button>
                )}
                {content}
              </div>
            );
          })}

          {renderAddControl(
            <button
              type="button"
              onClick={onQuickAdd ? undefined : activateAdd}
              disabled={disableInteraction}
              className={`border-border-card bg-tertiary-bg hover:border-border-focus flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors ${borderColor} ${
                disableInteraction
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              }`}
              aria-label="Add another item"
            >
              <svg
                className="text-primary-text h-5 w-5"
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
              <span className="text-primary-text text-xs font-medium">
                Add item
              </span>
            </button>,
          )}
        </div>
      </div>
    </div>
  );
};
