"use client";

import { useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOrder =
  | "alpha-asc"
  | "alpha-desc"
  | "created-asc"
  | "created-desc"
  | "cash-desc"
  | "cash-asc"
  | "duped-desc"
  | "duped-asc";

export interface InventoryStats {
  isLargeInventory: boolean;
  totalItems: number;
  duplicates: Array<[string, number]>;
  totalDuplicates: number;
  uniqueItems: number;
}

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  showOnlyOriginal: boolean;
  showOnlyNonOriginal: boolean;
  hideDuplicates: boolean;
  showMissingItems: boolean;
  showOnlyLimited: boolean;
  showOnlySeasonal: boolean;
  showOnlyTradable: boolean;
  showOnlyUntradable: boolean;
  availableCategories: string[];
  onFilterToggle: (checked: boolean) => void;
  onNonOriginalFilterToggle: (checked: boolean) => void;
  onHideDuplicatesToggle: (checked: boolean) => void;
  onShowMissingItemsToggle: (checked: boolean) => void;
  onLimitedFilterToggle: (checked: boolean) => void;
  onSeasonalFilterToggle: (checked: boolean) => void;
  onTradableFilterToggle: (checked: boolean) => void;
  onUntradableFilterToggle: (checked: boolean) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

export default function InventoryFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  showOnlyOriginal,
  showOnlyNonOriginal,
  hideDuplicates,
  showMissingItems,
  showOnlyLimited,
  showOnlySeasonal,
  showOnlyTradable,
  showOnlyUntradable,
  availableCategories,
  onFilterToggle,
  onNonOriginalFilterToggle,
  onHideDuplicatesToggle,
  onShowMissingItemsToggle,
  onLimitedFilterToggle,
  onSeasonalFilterToggle,
  onTradableFilterToggle,
  onUntradableFilterToggle,
  sortOrder,
  setSortOrder,
}: InventoryFiltersProps) {
  const MAX_SEARCH_LENGTH = 50;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const selectedCategoryValue = selectedCategories[0] ?? "all";
  const sortLabels: Record<SortOrder, string> = {
    "alpha-asc": "Name (A to Z)",
    "alpha-desc": "Name (Z to A)",
    "created-asc": "Oldest First",
    "created-desc": "Newest First",
    "cash-desc": "Cash Value (High to Low)",
    "cash-asc": "Cash Value (Low to High)",
    "duped-desc": "Duped Value (High to Low)",
    "duped-asc": "Duped Value (Low to High)",
  };

  return (
    <div className="mb-4 flex flex-col gap-4">
      {/* Main Filters Row */}

      {/* Search, Category, and Sort Filters */}
      <div className="flex w-full flex-col gap-4 sm:flex-row">
        {/* Search Bar - First */}
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={MAX_SEARCH_LENGTH}
            className="border-border-primary bg-primary-bg text-primary-text placeholder-secondary-text focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <Icon icon="heroicons:x-mark" />
            </button>
          )}
        </div>

        {/* Category Filter - Second */}
        <div className="w-full sm:w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-primary bg-primary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Filter by category"
              >
                <span className="truncate">
                  {selectedCategoryValue === "all"
                    ? "All categories"
                    : selectedCategoryValue}
                </span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-primary bg-primary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={selectedCategoryValue}
                onValueChange={(val) => {
                  if (val === "all") {
                    setSelectedCategories([]);
                  } else {
                    setSelectedCategories([val]);
                  }
                  window.umami?.track("Inventory Category Change", {
                    category: val === "all" ? "All" : val,
                  });
                }}
              >
                <DropdownMenuRadioItem
                  value="all"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  All categories
                </DropdownMenuRadioItem>
                {availableCategories.map((category) => (
                  <DropdownMenuRadioItem
                    key={category}
                    value={category}
                    className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sort Filter - Third */}
        <div className="w-full sm:w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-primary bg-primary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Sort items"
              >
                <span className="truncate">
                  {sortLabels[sortOrder] ?? "Sort"}
                </span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-primary bg-primary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(val) => {
                  const nextValue = val as SortOrder;
                  setSortOrder(nextValue);
                  window.umami?.track("Inventory Sort Change", {
                    sort: nextValue,
                  });
                }}
              >
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Alphabetically
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="alpha-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Name (A to Z)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="alpha-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Name (Z to A)
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Date
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="created-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Oldest First
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="created-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Newest First
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Values
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="cash-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Cash Value (High to Low)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="cash-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Cash Value (Low to High)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="duped-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Duped Value (High to Low)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="duped-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text data-[state=checked]:bg-quaternary-bg cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Duped Value (Low to High)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Advanced Filters Toggle Button */}
      <Button
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        size="sm"
        className="w-fit"
      >
        <Icon icon="rivet-icons:filter" className="h-4 w-4" inline={true} />
        Filter
      </Button>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="bg-primary-bg/50 border-border-primary rounded-lg border p-4">
          <div className="flex flex-col gap-4">
            {/* Owner Type Radio Group */}
            <div className="flex flex-col gap-2">
              <span className="text-primary-text text-sm font-medium">
                Owner Type:
              </span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={!showOnlyOriginal && !showOnlyNonOriginal}
                    onChange={() => {
                      onFilterToggle(false);
                      onNonOriginalFilterToggle(false);
                      window.umami?.track("Inventory Filter Owner Type Reset");
                    }}
                    className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                  />
                  <span className="text-primary-text text-sm">All</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={showOnlyOriginal}
                    onChange={() => {
                      onFilterToggle(true);
                      window.umami?.track("Inventory Filter Original Toggle", {
                        active: true,
                      });
                    }}
                    className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                  />
                  <span className="text-primary-text text-sm">Original</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={showOnlyNonOriginal}
                    onChange={() => {
                      onNonOriginalFilterToggle(true);
                      window.umami?.track(
                        "Inventory Filter Non-Original Toggle",
                        { active: true },
                      );
                    }}
                    className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                  />
                  <span className="text-primary-text text-sm">
                    Non-Original
                  </span>
                </label>
              </div>
            </div>

            {/* Item Property Checkboxes */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-primary-text text-sm font-medium">
                  Item Type:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="itemType"
                      checked={!showOnlyLimited && !showOnlySeasonal}
                      onChange={() => {
                        onLimitedFilterToggle(false);
                        onSeasonalFilterToggle(false);
                        window.umami?.track("Inventory Filter Item Type Reset");
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">All</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="itemType"
                      checked={showOnlyLimited}
                      onChange={() => {
                        onLimitedFilterToggle(true);
                        onSeasonalFilterToggle(false);
                        window.umami?.track("Inventory Filter Limited Toggle", {
                          active: true,
                        });
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">
                      Limited Only
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="itemType"
                      checked={showOnlySeasonal}
                      onChange={() => {
                        onLimitedFilterToggle(false);
                        onSeasonalFilterToggle(true);
                        window.umami?.track(
                          "Inventory Filter Seasonal Toggle",
                          { active: true },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">
                      Seasonal Only
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-primary-text text-sm font-medium">
                  Tradability:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      checked={!showOnlyTradable && !showOnlyUntradable}
                      onChange={() => {
                        onTradableFilterToggle(false);
                        onUntradableFilterToggle(false);
                        window.umami?.track(
                          "Inventory Filter Tradability Reset",
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">All</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      checked={showOnlyTradable}
                      onChange={() => {
                        onTradableFilterToggle(true);
                        window.umami?.track(
                          "Inventory Filter Tradable Toggle",
                          { active: true },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">
                      Tradable Only
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      checked={showOnlyUntradable}
                      onChange={() => {
                        onUntradableFilterToggle(true);
                        window.umami?.track(
                          "Inventory Filter Untradable Toggle",
                          { active: true },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                    />
                    <span className="text-primary-text text-sm">
                      Untradable Only
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-primary-text text-sm font-medium">
                  Other:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={hideDuplicates}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onHideDuplicatesToggle(checked);
                        window.umami?.track(
                          "Inventory Filter Hide Duplicates Toggle",
                          { active: checked },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
                    />
                    <span className="text-primary-text text-sm">
                      Hide Duplicates
                    </span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showMissingItems}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        onShowMissingItemsToggle(checked);
                        window.umami?.track(
                          "Inventory Filter Show Missing Items Toggle",
                          { active: checked },
                        );
                      }}
                      className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
                    />
                    <span className="text-primary-text text-sm">
                      Show Missing Items
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
