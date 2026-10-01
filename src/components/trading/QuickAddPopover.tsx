"use client";

import React, { Fragment, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TradeItem } from "@/types/trading";
import { FilterSort } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  filterGroups,
  filterOptions,
} from "@/components/Values/valuesFilterOptions";
import { Icon } from "@/components/ui/IconWrapper";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import { sortByValueSort } from "@/utils/trading/values";
import {
  getTradeItemImagePath,
  matchesCategoryFilterSort,
} from "@/utils/trading/tradeItems";
import { handleImageError } from "@/utils/ui/images";
import { usePartialItemFields } from "@/hooks/usePartialItems";

interface QuickAddPopoverProps {
  items: TradeItem[];
  onSelect: (item: TradeItem) => void;
  children: React.ReactNode;
  useCatalogApi?: boolean;
  allowOg?: boolean;
}

type ItemCondition = "clean" | "duped" | "og";
const QUICK_ADD_FIELDS = [
  "name",
  "type",
  "cash_value",
  "duped_value",
  "is_limited",
  "is_seasonal",
  "tradable",
  "demand",
] as const satisfies readonly (keyof TradeItem & string)[];

const SUPPORTED_FILTER_SORTS = new Set<FilterSort>([
  "name-all-items",
  "name-body-colors",
  "name-textures",
  "name-drifts",
  "name-furnitures",
  "name-horns",
  "name-hyperchromes",
  "name-limited-items",
  "name-rims",
  "name-spoilers",
  "name-tire-stickers",
  "name-tire-styles",
  "name-vehicles",
  "name-weapon-skins",
]);

const availableFilterGroups = filterGroups
  .map((group) => ({
    ...group,
    options: group.options.filter((option) =>
      SUPPORTED_FILTER_SORTS.has(option.value),
    ),
  }))
  .filter((group) => group.options.length > 0);

export const QuickAddPopover: React.FC<QuickAddPopoverProps> = ({
  items,
  onSelect,
  children,
  useCatalogApi = false,
  allowOg = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [conditionsByItem, setConditionsByItem] = useState<
    Record<string, ItemCondition>
  >({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );
  const catalog = usePartialItemFields<TradeItem>(
    QUICK_ADD_FIELDS,
    open && useCatalogApi,
  );
  const visibleItems: TradeItem[] = useMemo(
    () => (useCatalogApi ? (catalog.data ?? []) : items),
    [useCatalogApi, catalog.data, items],
  );

  const filterLabel =
    filterOptions.find((option) => option.value === filterSort)?.label ??
    "All Items";

  const results = useMemo(() => {
    const tradable = visibleItems.filter((item) => item.tradable === 1);
    const matched = tradable.filter(
      (item) =>
        matchesTextSearch([item.name, item.type], searchQuery) &&
        matchesCategoryFilterSort(item, filterSort),
    );
    return sortByValueSort(matched, "cash-desc", {
      getCashValue: (item) => item.cash_value ?? "N/A",
      getDupedValue: (item) => item.duped_value ?? "N/A",
      getDemand: (item) => item.demand ?? item.data?.demand,
    });
  }, [visibleItems, searchQuery, filterSort]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 44,
    overscan: 5,
  });

  const getCondition = (item: TradeItem): ItemCondition =>
    conditionsByItem[`${item.id}-${item.name}`] ??
    (item.isDuped ? "duped" : allowOg && item.isOG ? "og" : "clean");

  const conditionOptions: ItemCondition[] = allowOg
    ? ["clean", "duped", "og"]
    : ["clean", "duped"];

  const handlePick = (item: TradeItem) => {
    const condition = getCondition(item);
    setOpen(false);
    onSelect({
      ...item,
      isDuped: condition === "duped",
      isOG: condition === "og",
    });
    setSearchQuery("");
    setFilterSort("name-all-items");
    setHighlightedIndex(0);
  };

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearchQuery("");
          setFilterSort("name-all-items");
          setHighlightedIndex(0);
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={{ top: 72, right: 8, bottom: 8, left: 8 }}
        className="flex h-96 max-h-[var(--radix-popover-content-available-height)] w-[25rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="border-border-card flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text h-4 w-4 shrink-0"
          />
          <input
            ref={searchInputRef}
            autoFocus
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
              scrollElement?.scrollTo({ top: 0 });
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (results.length === 0) return;
                const next = Math.min(highlightedIndex + 1, results.length - 1);
                setHighlightedIndex(next);
                virtualizer.scrollToIndex(next);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                const next = Math.max(highlightedIndex - 1, 0);
                setHighlightedIndex(next);
                virtualizer.scrollToIndex(next);
              } else if (e.key === "Enter") {
                e.preventDefault();
                const picked = results[highlightedIndex];
                if (picked) handlePick(picked);
              }
            }}
            placeholder="Search item..."
            className="text-primary-text placeholder-secondary-text w-full bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="border-border-card shrink-0 border-b p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-card bg-tertiary-bg text-primary-text hover:border-border-focus flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border px-3 text-xs transition-colors focus:outline-none"
                aria-label="Filter by category"
              >
                <span className="truncate">{filterLabel}</span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-4 w-4"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-tertiary-bg text-primary-text max-h-72 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={filterSort}
                onValueChange={(val) => {
                  setFilterSort(val as FilterSort);
                  setHighlightedIndex(0);
                  scrollElement?.scrollTo({ top: 0 });
                }}
              >
                {availableFilterGroups.map((group, index) => (
                  <Fragment key={group.label}>
                    <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.options.map((option) => (
                      <DropdownMenuRadioItem
                        key={option.value}
                        value={option.value}
                        className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                      >
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                    {index !== availableFilterGroups.length - 1 && (
                      <DropdownMenuSeparator className="bg-border-primary/60" />
                    )}
                  </Fragment>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          ref={setScrollElement}
          className="min-h-0 flex-1 overflow-y-auto p-1"
        >
          {useCatalogApi && catalog.isPending ? (
            <p className="text-secondary-text px-3 py-4 text-center text-sm">
              Loading items...
            </p>
          ) : useCatalogApi && catalog.isError ? (
            <p className="text-secondary-text px-3 py-4 text-center text-sm">
              Could not load items.
            </p>
          ) : results.length === 0 ? (
            <p className="text-secondary-text px-3 py-4 text-center text-sm">
              No items found
            </p>
          ) : (
            <div
              className="relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const index = virtualItem.index;
                const item = results[index];
                const itemKey = `${item.id}-${item.name}`;
                const condition = getCondition(item);
                return (
                  <div
                    key={itemKey}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`absolute top-0 left-0 flex h-11 w-full items-center gap-1 rounded-lg p-1 transition-colors ${
                      index === highlightedIndex
                        ? "bg-tertiary-bg"
                        : "hover:bg-tertiary-bg"
                    }`}
                    style={{ transform: `translateY(${virtualItem.start}px)` }}
                  >
                    <button
                      type="button"
                      onClick={() => handlePick(item)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-1 py-0.5 text-left"
                    >
                      <span className="bg-tertiary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded">
                        <Image
                          src={getTradeItemImagePath(item, true)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          onError={handleImageError}
                        />
                      </span>
                      <span className="text-primary-text min-w-0 flex-1 truncate text-sm font-medium">
                        {item.name}
                      </span>
                    </button>
                    {conditionOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setConditionsByItem((current) => ({
                            ...current,
                            [itemKey]: option,
                          }));
                          searchInputRef.current?.focus();
                        }}
                        aria-label={
                          option === "og"
                            ? `Mark ${item.name} as OG`
                            : `Use ${option} value for ${item.name}`
                        }
                        aria-pressed={condition === option}
                        className={`shrink-0 cursor-pointer rounded border px-1.5 py-1 text-[10px] font-medium capitalize transition-colors ${
                          condition === option
                            ? option === "clean"
                              ? "border-status-success bg-status-success text-form-button-text"
                              : option === "duped"
                                ? "border-status-error bg-status-error text-form-button-text"
                                : "border-button-info bg-button-info text-form-button-text"
                            : "border-border-card bg-secondary-bg text-secondary-text hover:text-primary-text"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
