import React, { useState } from "react";
import { TradeItem } from "@/types/trading";
import Image from "next/image";
import { getItemImagePath, isVideoItem, getVideoPath } from "@/utils/ui/images";
import { Icon } from "../../ui/IconWrapper";
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { hasItemValue } from "@/utils/items/itemValue";
import {
  formatByMode,
  parseValueString,
  type NumberDisplayMode,
} from "./calculatorUtils";
import { FOCUS_RING, SIDE_STYLES } from "./calculatorStyles";
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
  onRemoveGroup?: (instanceIds: string[]) => void;
  onDuplicate?: (item: TradeItem) => void;
  onValueTypeChange?: (
    itemId: number,
    valueType: "cash" | "duped",
    instanceId?: string,
  ) => void;
  getSelectedValueType?: (item: TradeItem) => "cash" | "duped";
  getSelectedValue?: (item: TradeItem) => number;
  side?: "offering" | "requesting";
  numberMode?: NumberDisplayMode;
  onBrowse?: () => void;
}

interface ItemGroup {
  key: string;
  representative: TradeItem;
  instanceIds: string[];
}

const ItemImage: React.FC<{ item: TradeItem }> = ({ item }) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  if (isVideoItem(item.name)) {
    return (
      <video
        src={getVideoPath(item.type, item.name)}
        className="h-full w-full object-cover"
        muted
        playsInline
        loop
        autoPlay
      />
    );
  }

  return (
    <>
      {status !== "loaded" && (
        <div
          className={`bg-quaternary-bg absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center ${
            status === "loading"
              ? "animate-pulse motion-reduce:animate-none"
              : ""
          }`}
        >
          {status === "error" && (
            <>
              <Icon
                icon="heroicons:photo"
                className="text-secondary-text h-6 w-6"
                aria-hidden="true"
              />
              <span className="text-secondary-text line-clamp-2 text-[10px] leading-tight">
                {item.name}
              </span>
            </>
          )}
        </div>
      )}
      {status !== "error" && (
        <Image
          src={getItemImagePath(item.type, item.name, true)}
          alt={item.name}
          fill
          className={`object-cover transition-opacity duration-200 motion-reduce:transition-none ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
    </>
  );
};

interface AddCopyButtonProps {
  item: TradeItem;
  displayName: string;
  numberMode: NumberDisplayMode;
  hasDupedValue: boolean;
  disabled: boolean;
  className: string;
  onAdd: (item: TradeItem) => void;
}

const AddCopyButton: React.FC<AddCopyButtonProps> = ({
  item,
  displayName,
  numberMode,
  hasDupedValue,
  disabled,
  className,
  onAdd,
}) => {
  const [open, setOpen] = useState(false);

  const icon = <Icon icon="heroicons:plus" className="h-3.5 w-3.5" />;
  const label = `Add another ${displayName}`;

  if (!hasDupedValue) {
    return (
      <button
        type="button"
        onClick={() => onAdd(item)}
        disabled={disabled}
        className={className}
        aria-label={label}
      >
        {icon}
      </button>
    );
  }

  const choose = (isDuped: boolean) => {
    onAdd({ ...item, isDuped });
    setOpen(false);
  };

  const options = [
    { duped: false, label: "Clean", value: parseValueString(item.cash_value) },
    { duped: true, label: "Duped", value: parseValueString(item.duped_value) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={className}
          aria-label={`${label} (choose Clean or Duped)`}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="center">
        <p className="text-secondary-text px-1 pb-1.5 text-xs font-medium">
          Which version of {displayName}?
        </p>
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => choose(option.duped)}
              className={`border-border-card bg-tertiary-bg hover:bg-quaternary-bg text-primary-text flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-sm font-semibold transition-colors pointer-coarse:min-h-11 ${FOCUS_RING}`}
            >
              <span>{option.label}</span>
              <span className="text-secondary-text text-xs tabular-nums">
                {formatByMode(option.value, numberMode)}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const CalculatorItemGrid: React.FC<CalculatorItemGridProps> = ({
  items,
  catalogItems,
  useCatalogApi = false,
  onRemove,
  onRemoveGroup,
  onDuplicate,
  onValueTypeChange,
  getSelectedValueType,
  getSelectedValue,
  side = "offering",
  numberMode = "full",
  onBrowse,
}) => {
  const sideStyle = SIDE_STYLES[side];

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <QuickAddPopover
          items={catalogItems ?? []}
          useCatalogApi={useCatalogApi}
          allowOg
          onSelect={(item) => onDuplicate?.(item)}
        >
          <button
            type="button"
            aria-label={`Add an item to ${sideStyle.label}`}
            className={`bg-tertiary-bg/60 text-secondary-text hover:text-primary-text flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${sideStyle.slotBorder} ${sideStyle.slotHoverBorder} ${FOCUS_RING}`}
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${sideStyle.iconChip}`}
            >
              <Icon
                icon="heroicons:plus"
                className="h-6 w-6"
                aria-hidden="true"
              />
            </span>
            <span className="text-primary-text text-sm font-semibold">
              Nothing here yet
            </span>
            <span className="text-xs">
              Click here to search and add an item
            </span>
          </button>
        </QuickAddPopover>
        {onBrowse && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBrowse}
              className="pointer-coarse:h-10!"
            >
              <Icon icon="heroicons:magnifying-glass" />
              Browse all items
            </Button>
          </div>
        )}
      </div>
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

  const itemOrder = new Map<number, number>();
  items.forEach((item) => {
    if (!itemOrder.has(item.id)) itemOrder.set(item.id, itemOrder.size);
  });
  const conditionRank = (item: TradeItem) =>
    item.isOG ? 2 : item.isDuped ? 1 : 0;
  groups.sort(
    (a, b) =>
      (itemOrder.get(a.representative.id) ?? 0) -
        (itemOrder.get(b.representative.id) ?? 0) ||
      conditionRank(a.representative) - conditionRank(b.representative),
  );

  return (
    <div className="rounded-lg">
      <div aria-label="Selected items list">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-9">
          {groups.map((group) => {
            const item = group.representative;
            const qty = group.instanceIds.length;
            const displayName = item.name;
            const isDupedSelected = !!item.isDuped;

            const selectedType =
              getSelectedValueType?.(item) ?? (item.isDuped ? "duped" : "cash");
            const hasDupedValue = hasItemValue(item.duped_value);
            const unitValue = getSelectedValue
              ? getSelectedValue(item)
              : parseValueString(item.cash_value);
            const displayValue = formatByMode(unitValue, numberMode);
            const groupTotal = formatByMode(unitValue * qty, numberMode);
            const isLimited = item.is_limited === 1;
            const isSeasonal = item.season != null;
            const lastInstanceId =
              group.instanceIds[group.instanceIds.length - 1];

            const handleDecrement = () => {
              if (lastInstanceId) onRemove?.(lastInstanceId);
            };
            const handleIncrement = (copy: TradeItem) => {
              onDuplicate?.(copy);
            };

            const handleRemoveAll = () => {
              if (onRemoveGroup) {
                onRemoveGroup(group.instanceIds);
              } else {
                group.instanceIds.forEach((id) => onRemove?.(id));
              }
            };

            const stepperButtonClass = `text-primary-text hover:bg-quaternary-bg flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:h-9 pointer-coarse:w-9 ${FOCUS_RING}`;

            return (
              <div
                key={group.key}
                className={`group border-border-card bg-tertiary-bg/50 relative rounded-lg border p-1.5 ${
                  qty > 1
                    ? "shadow-[2px_2px_0_0_var(--color-border-card),4px_4px_0_0_var(--color-border-card)]"
                    : ""
                }`}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label={
                    qty > 1
                      ? `Remove one ${displayName}`
                      : `Remove ${displayName}`
                  }
                  className="group/remove focus-visible:outline-status-error absolute inset-0 z-10 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="pointer-events-none absolute inset-x-1.5 top-1.5 flex aspect-video items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover/remove:opacity-100 group-focus-visible/remove:opacity-100">
                    <span className="bg-status-error/90 flex h-8 w-8 items-center justify-center rounded-full text-white">
                      <Icon icon="heroicons:x-mark" className="h-5 w-5" />
                    </span>
                  </span>
                </button>
                <div className="relative">
                  <div className="bg-quaternary-bg relative aspect-video overflow-hidden rounded-lg">
                    <ItemImage item={item} />
                    {isDupedSelected && (
                      <div className="absolute top-1 left-1 z-10">
                        <DupedBadge compact />
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
                  {qty > 1 && (
                    <div className="pointer-events-none absolute bottom-1 left-1 z-10">
                      <span
                        className="inline-flex items-center rounded-md bg-black/80 px-1.5 py-0.5 text-xs leading-none font-extrabold text-white shadow"
                        aria-label={`Quantity ${qty}`}
                      >
                        ×{qty}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className="text-primary-text min-w-0 truncate text-[11px] font-semibold"
                      title={displayName}
                    >
                      {displayName}
                    </p>
                    <span className="relative z-20">
                      <TradeItemNote item={item} name={displayName} />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <p className="text-primary-text text-xs font-bold tabular-nums">
                      {displayValue}
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
                      aria-label={
                        hasDupedValue && onValueTypeChange
                          ? `${displayName} is ${selectedType === "duped" ? "Duped" : "Clean"}. Switch to ${selectedType === "duped" ? "Clean" : "Duped"}`
                          : undefined
                      }
                      className={`relative z-20 inline-flex h-4 items-center justify-center rounded px-1.5 text-[9px] leading-none font-semibold transition-colors ${FOCUS_RING} ${
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
                  {qty > 1 && (
                    <p className="text-secondary-text text-[10px] tabular-nums">
                      ×{qty} ={" "}
                      <span className="text-primary-text font-semibold">
                        {groupTotal}
                      </span>
                    </p>
                  )}
                  <div className="relative z-20 flex items-center justify-between gap-1">
                    <div
                      className="border-border-card bg-secondary-bg inline-flex items-center rounded-full border"
                      role="group"
                      aria-label={`Quantity of ${displayName}`}
                    >
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className={stepperButtonClass}
                        aria-label={
                          qty > 1
                            ? `Remove one ${displayName}`
                            : `Remove ${displayName}`
                        }
                      >
                        <Icon icon="heroicons:minus" className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-primary-text min-w-4 text-center text-xs font-bold tabular-nums">
                        {qty}
                      </span>
                      <AddCopyButton
                        item={item}
                        displayName={displayName}
                        numberMode={numberMode}
                        hasDupedValue={hasDupedValue}
                        disabled={!onDuplicate}
                        className={stepperButtonClass}
                        onAdd={handleIncrement}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAll}
                      className={`text-status-error hover:bg-status-error/10 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md transition-colors pointer-coarse:h-9 pointer-coarse:w-9 ${FOCUS_RING}`}
                      aria-label={
                        qty > 1
                          ? `Remove all ${qty} ${displayName}`
                          : `Remove ${displayName}`
                      }
                    >
                      <Icon
                        icon="heroicons-outline:trash"
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div className="relative z-20 [&_span:first-child]:w-9 [&>div]:pt-1 [&>div]:text-[10px]">
                    <TradeItemMarketDetails
                      item={item}
                      isDuped={selectedType === "duped"}
                    />
                  </div>
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
              className={`bg-tertiary-bg/60 text-secondary-text hover:text-primary-text flex h-full min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${sideStyle.slotBorder} ${sideStyle.slotHoverBorder} ${FOCUS_RING}`}
              aria-label="Add another item"
            >
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${sideStyle.iconChip}`}
              >
                <Icon
                  icon="heroicons:plus"
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>
              <span className="text-xs font-semibold">Add item</span>
            </button>
          </QuickAddPopover>
        </div>
      </div>
    </div>
  );
};
