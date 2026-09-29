import React from "react";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import {
  getItemImagePath,
  handleImageError,
  isVideoItem,
  getVideoPath,
} from "@/utils/ui/images";
import { Icon } from "../../ui/IconWrapper";
import { formatCurrencyValue, parseValueString } from "./calculatorUtils";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";
import { QuickAddPopover } from "./QuickAddPopover";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import { hasItemValue } from "@/utils/items/itemValue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculatorItemGridProps {
  items: TradeItem[];
  catalogItems?: TradeItem[];
  useCatalogApi?: boolean;
  onRemove?: (instanceId: string) => void;
  onDuplicate?: (item: TradeItem) => void;
  onValueTypeChange?: (
    itemId: number,
    valueType: "cash" | "duped",
    instanceId?: string,
  ) => void;
  getSelectedValueType?: (item: TradeItem) => "cash" | "duped";
  getSelectedValue?: (item: TradeItem) => number;
  side?: "offering" | "requesting";
}

interface ItemGroup {
  key: string;
  representative: TradeItem;
  instanceIds: string[];
}

const NoteButton = ({
  name,
  ...buttonProps
}: { name: string } & React.ComponentProps<"button">) => (
  <button
    {...buttonProps}
    type="button"
    className="border-border-card bg-secondary-bg text-secondary-text hover:text-primary-text inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border [@media(hover:hover)]:h-6 [@media(hover:hover)]:w-6"
    aria-label={`Read note for ${name}`}
  >
    <Icon icon="mdi:information-outline" className="h-3.5 w-3.5" />
  </button>
);

export const CalculatorItemGrid: React.FC<CalculatorItemGridProps> = ({
  items,
  catalogItems,
  useCatalogApi = false,
  onRemove,
  onDuplicate,
  onValueTypeChange,
  getSelectedValueType,
  getSelectedValue,
  side,
}) => {
  const isOffering = side === "offering";
  const borderColor = isOffering
    ? "border-status-success/30 hover:border-status-success/60"
    : "border-status-error/30 hover:border-status-error/60";

  if (items.length === 0) {
    return (
      <QuickAddPopover
        items={catalogItems ?? []}
        useCatalogApi={useCatalogApi}
        onSelect={(item) => onDuplicate?.(item)}
      >
        <button
          type="button"
          className={`border-border-card bg-tertiary-bg hover:border-border-focus w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${borderColor}`}
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
            Search for an item to add it
          </p>
        </button>
      </QuickAddPopover>
    );
  }

  // Same item + same clean/duped condition merges into a single card with a
  // qty stepper, instead of one card per instance cluttering the grid.
  const groups: ItemGroup[] = [];
  const groupByKey = new Map<string, ItemGroup>();
  items.forEach((item) => {
    const key = `${item.id}-${item.isDuped ? "duped" : "clean"}-${item.isOG ? "og" : "std"}`;
    const existing = groupByKey.get(key);
    if (existing) {
      if (item.instanceId) existing.instanceIds.push(item.instanceId);
    } else {
      const group: ItemGroup = {
        key,
        representative: item,
        instanceIds: item.instanceId ? [item.instanceId] : [],
      };
      groupByKey.set(key, group);
      groups.push(group);
    }
  });

  return (
    <div className="rounded-lg">
      <div
        className="max-h-120 overflow-y-auto pr-1"
        aria-label="Selected items list"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {groups.map((group) => {
            const item = group.representative;
            const qty = group.instanceIds.length;
            const displayName = item.name;
            const isDupedSelected = !!item.isDuped;

            const selectedType = getSelectedValueType?.(item) ?? "cash";
            const hasDupedValue =
              item.duped_value !== null &&
              item.duped_value !== undefined &&
              item.duped_value !== "N/A";
            const displayValue = getSelectedValue
              ? formatCurrencyValue(getSelectedValue(item))
              : formatCurrencyValue(parseValueString(item.cash_value));
            const isLimited =
              item.is_limited === 1 || item.data?.is_limited === 1;
            const isSeasonal = item.season != null || item.data?.season != null;
            const lastInstanceId =
              group.instanceIds[group.instanceIds.length - 1];
            const demand =
              selectedType === "duped"
                ? (item.duped_demand ?? item.data?.duped_demand)
                : (item.demand ?? item.data?.demand);
            const trend = item.trend ?? item.data?.trend;
            const notes = item.notes ?? item.data?.notes;

            const handleDecrement = () => {
              if (lastInstanceId) onRemove?.(lastInstanceId);
            };
            const handleIncrement = () => {
              onDuplicate?.(item);
            };

            const stepperButtonClass =
              "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40";

            return (
              <div
                key={group.key}
                className="group border-border-card bg-tertiary-bg/50 relative rounded-xl border p-2.5"
              >
                <div className="relative">
                  <div className="relative aspect-video overflow-hidden rounded-lg">
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
                      <div className="absolute top-1 left-1 z-10">
                        <span className="bg-status-error/90 text-form-button-text inline-flex h-5 items-center justify-center rounded px-2 text-[10px] leading-none font-semibold">
                          Duped
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pointer-events-none absolute top-1 right-1 z-10">
                    <CategoryIconBadge
                      type={item.type}
                      isLimited={isLimited}
                      isSeasonal={isSeasonal}
                      className="h-3.5 w-3.5"
                    />
                  </div>
                  {/* Hover/focus reveal on devices with real hover; always shown on touch
                      (hover:none), since there's no hover gesture to reveal it there. */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 rounded-b-lg bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-has-[:focus-visible]:pointer-events-auto group-has-[:focus-visible]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className={`${stepperButtonClass} border border-white/20 bg-black/70 text-white hover:bg-black/90`}
                      aria-label={
                        qty > 1
                          ? `Remove one ${displayName}`
                          : `Remove ${displayName}`
                      }
                    >
                      <Icon icon="heroicons:minus" className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 rounded-full bg-black/70 px-1.5 py-0.5 text-center text-xs font-bold text-white">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={!onDuplicate}
                      className={`${stepperButtonClass} border border-white/20 bg-black/70 text-white hover:bg-black/90`}
                      aria-label={`Add another ${displayName}`}
                    >
                      <Icon icon="heroicons:plus" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className="text-primary-text min-w-0 truncate text-xs font-semibold"
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    {hasItemValue(notes) && (
                      <>
                        <span className="hidden [@media(hover:hover)]:inline-flex">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NoteButton name={displayName} />
                            </TooltipTrigger>
                            <TooltipContent className="max-h-64 max-w-72 overflow-y-auto whitespace-pre-wrap">
                              {notes}
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="inline-flex [@media(hover:hover)]:hidden">
                          <Popover>
                            <PopoverTrigger asChild>
                              <NoteButton name={displayName} />
                            </PopoverTrigger>
                            <PopoverContent className="max-h-64 w-64 overflow-y-auto p-3 text-sm whitespace-pre-wrap">
                              {notes}
                            </PopoverContent>
                          </Popover>
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-primary-text text-sm font-bold">
                      {displayValue}
                      {qty > 1 && (
                        <span className="text-secondary-text ml-1 text-[10px] font-semibold">
                          ×{qty}
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      disabled={!hasDupedValue || !onValueTypeChange}
                      onClick={() => {
                        const nextType =
                          selectedType === "duped" ? "cash" : "duped";
                        group.instanceIds.forEach((id) => {
                          onValueTypeChange?.(item.id, nextType, id);
                        });
                      }}
                      className={`inline-flex h-5 items-center justify-center rounded px-2 text-[10px] leading-none font-semibold transition-colors ${
                        selectedType === "duped"
                          ? "bg-status-error text-form-button-text"
                          : "bg-status-success text-form-button-text"
                      } ${
                        !hasDupedValue || !onValueTypeChange
                          ? "cursor-default"
                          : "cursor-pointer hover:opacity-90"
                      }`}
                    >
                      {selectedType === "duped" ? "Duped" : "Clean"}
                    </button>
                  </div>
                  <div className="border-border-card space-y-1 border-t pt-2 text-[11px]">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="text-secondary-text w-11 shrink-0">
                        Demand
                      </span>
                      <span
                        className={`${getDemandColor(demand)} min-w-0 truncate rounded px-1.5 py-0.5 font-semibold whitespace-nowrap`}
                        title={hasItemValue(demand) ? demand : "Unknown"}
                      >
                        {hasItemValue(demand) ? demand : "Unknown"}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="text-secondary-text w-11 shrink-0">
                        Trend
                      </span>
                      <span
                        className={`${getTrendColor(trend)} min-w-0 truncate rounded px-1.5 py-0.5 font-semibold whitespace-nowrap`}
                        title={hasItemValue(trend) ? trend : "Unknown"}
                      >
                        {hasItemValue(trend) ? trend : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Persistent add slot — shows how to add another item without
              needing to hit an empty state first. */}
          <QuickAddPopover
            items={catalogItems ?? []}
            useCatalogApi={useCatalogApi}
            onSelect={(item) => onDuplicate?.(item)}
          >
            <button
              type="button"
              className={`border-border-card bg-tertiary-bg hover:border-border-focus flex h-full min-h-54 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors ${borderColor}`}
              aria-label="Add another item"
            >
              <Icon
                icon="heroicons:plus"
                className="text-secondary-text/60 h-5 w-5"
              />
              <span className="text-secondary-text/70 text-xs font-medium">
                Add item
              </span>
            </button>
          </QuickAddPopover>
        </div>
      </div>
    </div>
  );
};
