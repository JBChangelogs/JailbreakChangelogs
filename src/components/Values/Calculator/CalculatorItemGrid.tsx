import { ItemUnlockBadges } from "@/components/Items/ItemUnlockBadges";
import { isSeasonalItem } from "@/utils/items/season";
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
import { parseValueString } from "./calculatorUtils";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";
import { QuickAddPopover } from "@/components/trading/QuickAddPopover";
import { DupedBadge } from "@/components/trading/DupedBadge";
import {
  TradeItemMarketDetails,
  TradeItemNote,
} from "@/components/trading/TradeItemContext";

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
    : "border-button-danger/30 hover:border-button-danger/60";

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

            const selectedType =
              getSelectedValueType?.(item) ?? (item.isDuped ? "duped" : "cash");
            const hasDupedValue =
              item.duped_value !== null &&
              item.duped_value !== undefined &&
              item.duped_value !== "N/A";
            const displayValue = getSelectedValue
              ? getSelectedValue(item).toLocaleString()
              : parseValueString(item.cash_value).toLocaleString();
            const isLimited = item.is_limited === 1;
            const isSeasonal = isSeasonalItem(item);
            const lastInstanceId =
              group.instanceIds[group.instanceIds.length - 1];

            const handleDecrement = () => {
              if (lastInstanceId) onRemove?.(lastInstanceId);
            };
            const handleIncrement = () => {
              onDuplicate?.(item);
            };

            const stepperButtonClass =
              "text-primary-text hover:bg-quaternary-bg focus-visible:outline-border-focus flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2";

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
                        src={getItemImagePath(item.type, item.name, true)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        draggable={false}
                        onError={handleImageError}
                      />
                    )}
                    {isDupedSelected && (
                      <div className="absolute top-1 left-1 z-10">
                        <DupedBadge compact />
                      </div>
                    )}
                  </div>
                  <ItemUnlockBadges season={item.season} level={item.level} />
                  <div className="pointer-events-none absolute top-1.5 right-1.5 z-10">
                    <CategoryIconBadge
                      type={item.type}
                      isLimited={isLimited}
                      isSeasonal={isSeasonal}
                      withContainer={false}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    />
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
                    <span className="relative z-20">
                      <TradeItemNote item={item} name={displayName} />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-primary-text text-sm font-bold tabular-nums">
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
                      aria-label={`${displayName} is ${selectedType === "duped" ? "Duped" : item.isOG ? "OG" : "Clean"}${hasDupedValue && onValueTypeChange ? `. Switch to ${selectedType === "duped" ? "Clean" : "Duped"}` : ""}`}
                      onClick={() => {
                        const nextType =
                          selectedType === "duped" ? "cash" : "duped";
                        group.instanceIds.forEach((id) => {
                          onValueTypeChange?.(item.id, nextType, id);
                        });
                      }}
                      className={`focus-visible:outline-border-focus relative z-20 inline-flex h-5 items-center justify-center rounded-md px-2 text-[10px] leading-none font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                        selectedType === "duped"
                          ? "bg-status-error text-form-button-text"
                          : item.isOG
                            ? "text-primary-text border border-[#FFD700]/50 bg-[#FFD700]/10"
                            : "bg-status-success text-form-button-text"
                      } ${
                        !hasDupedValue || !onValueTypeChange
                          ? "cursor-default"
                          : "cursor-pointer hover:opacity-90"
                      }`}
                    >
                      {selectedType === "duped"
                        ? "Duped"
                        : item.isOG
                          ? "OG"
                          : "Clean"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="border-border-card inline-flex items-center rounded-full border">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={!onRemove}
                        className={stepperButtonClass}
                        aria-label={
                          qty > 1
                            ? `Remove one ${displayName}`
                            : `Remove ${displayName}`
                        }
                      >
                        <Icon icon="heroicons:minus" className="h-4 w-4" />
                      </button>
                      <span className="text-primary-text min-w-5 text-center text-xs font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={!onDuplicate}
                        className={stepperButtonClass}
                        aria-label={`Add another ${displayName}`}
                      >
                        <Icon icon="heroicons:plus" className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!onRemove}
                      onClick={() =>
                        group.instanceIds.forEach((id) => onRemove?.(id))
                      }
                      className="text-button-danger hover:bg-button-danger/10 focus-visible:outline-border-focus inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove all ${qty} ${displayName}`}
                    >
                      <Icon
                        icon="heroicons-outline:trash"
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                  <TradeItemMarketDetails
                    item={item}
                    isDuped={selectedType === "duped"}
                  />
                </div>
              </div>
            );
          })}
          <QuickAddPopover
            key="quick-add"
            items={catalogItems ?? []}
            useCatalogApi={useCatalogApi}
            allowOg
            onSelect={(item) => onDuplicate?.(item)}
          >
            <button
              type="button"
              className={`border-border-card bg-tertiary-bg hover:border-border-focus flex min-h-54 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-3 text-center transition-colors ${items.length === 0 ? "col-span-2 md:col-span-3" : ""} ${borderColor}`}
              aria-label={items.length === 0 ? "Add item" : "Add another item"}
            >
              <Icon
                icon="heroicons:plus"
                className="text-primary-text h-5 w-5"
              />
              <span className="text-primary-text text-xs font-medium">
                {items.length === 0 ? "No items selected" : "Add item"}
              </span>
              {items.length === 0 && (
                <span className="text-secondary-text text-xs">
                  Search for an item to add it
                </span>
              )}
            </button>
          </QuickAddPopover>
        </div>
      </div>
    </div>
  );
};
