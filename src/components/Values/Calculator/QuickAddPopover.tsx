"use client";

import React, { Fragment, useMemo, useState } from "react";
import Image from "next/image";
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
import { Icon } from "../../ui/IconWrapper";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import { sortByValueSort } from "@/utils/trading/values";
import {
  getTradeItemImagePath,
  matchesCategoryFilterSort,
} from "@/utils/trading/tradeItems";
import { handleImageError } from "@/utils/ui/images";

interface QuickAddPopoverProps {
  items: TradeItem[];
  onSelect: (item: TradeItem) => void;
  children: React.ReactNode;
}

const MAX_RESULTS = 8;

// Same subset TradeItemPickerV2 supports — season-based filters aren't
// relevant here since the calculator has no season context.
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
  "name-seasonal-items",
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

/**
 * Fast, inline alternative to scrolling down to the full item picker: search
 * + pick without leaving the current spot. Stays open after a pick so
 * several items can be added in a row; the full TradeItemPickerV2 below
 * still exists for sorting/favorites.
 */
export const QuickAddPopover: React.FC<QuickAddPopoverProps> = ({
  items,
  onSelect,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSort, setFilterSort] = useState<FilterSort>("name-all-items");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filterLabel =
    filterOptions.find((option) => option.value === filterSort)?.label ??
    "All Items";

  const results = useMemo(() => {
    const tradable = items.filter((item) => item.tradable === 1);
    const matched = tradable.filter(
      (item) =>
        matchesTextSearch([item.name, item.type], searchQuery) &&
        matchesCategoryFilterSort(item, filterSort),
    );
    const sorted = sortByValueSort(matched, "cash-desc", {
      getCashValue: (item) => item.cash_value ?? "N/A",
      getDupedValue: (item) => item.duped_value ?? "N/A",
      getDemand: (item) => item.demand ?? item.data?.demand,
    });
    return sorted.slice(0, MAX_RESULTS);
  }, [items, searchQuery, filterSort]);

  const handlePick = (item: TradeItem) => {
    onSelect(item);
    setSearchQuery("");
    setHighlightedIndex(0);
  };

  return (
    <Popover
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
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-border-card flex items-center gap-2 border-b px-3 py-2">
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text h-4 w-4 shrink-0"
          />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((i) => Math.max(i - 1, 0));
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

        <div className="border-border-card border-b p-2">
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
                onValueChange={(val) => setFilterSort(val as FilterSort)}
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

        <div className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="text-secondary-text px-3 py-4 text-center text-sm">
              No items found
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={`${item.id}-${item.name}`}
                type="button"
                onClick={() => handlePick(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                  index === highlightedIndex
                    ? "bg-tertiary-bg"
                    : "hover:bg-tertiary-bg"
                }`}
              >
                <div className="bg-tertiary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded">
                  <Image
                    src={getTradeItemImagePath(item, true)}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                </div>
                <span className="text-primary-text min-w-0 flex-1 truncate text-sm font-medium">
                  {item.name}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
