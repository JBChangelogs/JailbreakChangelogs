"use client";

import { useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface InventorySortGroup {
  label: string;
  options: { value: string; label: string }[];
}

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  showOnlyOriginal: boolean;
  showOnlyNonOriginal: boolean;
  showOnlySigned: boolean;
  hideDuplicates: boolean;
  showMissingItems: boolean;
  showOnlyLimited: boolean;
  showOnlySeasonal: boolean;
  showOnlyTradable: boolean;
  showOnlyUntradable: boolean;
  availableCategories: string[];
  onFilterToggle: (checked: boolean) => void;
  onNonOriginalFilterToggle: (checked: boolean) => void;
  onSignedFilterToggle: (checked: boolean) => void;
  onHideDuplicatesToggle: (checked: boolean) => void;
  onShowMissingItemsToggle: (checked: boolean) => void;
  onLimitedFilterToggle: (checked: boolean) => void;
  onSeasonalFilterToggle: (checked: boolean) => void;
  onTradableFilterToggle: (checked: boolean) => void;
  onUntradableFilterToggle: (checked: boolean) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  sortGroups: InventorySortGroup[];
}

export default function InventoryFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  showOnlyOriginal,
  showOnlyNonOriginal,
  showOnlySigned,
  hideDuplicates,
  showMissingItems,
  showOnlyLimited,
  showOnlySeasonal,
  showOnlyTradable,
  showOnlyUntradable,
  availableCategories,
  onFilterToggle,
  onNonOriginalFilterToggle,
  onSignedFilterToggle,
  onHideDuplicatesToggle,
  onShowMissingItemsToggle,
  onLimitedFilterToggle,
  onSeasonalFilterToggle,
  onTradableFilterToggle,
  onUntradableFilterToggle,
  sortOrder,
  setSortOrder,
  sortGroups,
}: InventoryFiltersProps) {
  const MAX_SEARCH_LENGTH = 50;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const selectedCategoryValue = selectedCategories[0] ?? "all";
  const sortLabel =
    sortGroups
      .flatMap((group) => group.options)
      .find((option) => option.value === sortOrder)?.label ?? "Sort";

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
            className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info min-h-14 w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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
                className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
              className="border-border-card bg-tertiary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={selectedCategoryValue}
                onValueChange={(val) => {
                  if (val === "all") {
                    setSelectedCategories([]);
                  } else {
                    setSelectedCategories([val]);
                  }
                  window.rybbit?.event("Inventory Category Change", {
                    category: val === "all" ? "All" : val,
                  });
                }}
              >
                <DropdownMenuRadioItem
                  value="all"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  All categories
                </DropdownMenuRadioItem>
                {availableCategories.map((category) => (
                  <DropdownMenuRadioItem
                    key={category}
                    value={category}
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
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
                className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Sort items"
              >
                <span className="truncate">{sortLabel}</span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-tertiary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(nextValue) => {
                  setSortOrder(nextValue);
                  window.rybbit?.event("Inventory Sort Change", {
                    sort: nextValue,
                  });
                }}
              >
                {sortGroups.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 && <DropdownMenuSeparator />}
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
                  </div>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          size="sm"
          variant={showAdvancedFilters ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon icon="rivet-icons:filter" className="h-4 w-4" inline={true} />
          Filter
          <Icon
            icon={
              showAdvancedFilters
                ? "heroicons:chevron-up"
                : "heroicons:chevron-down"
            }
            className="h-4 w-4"
            inline={true}
          />
        </Button>
        <Button
          onClick={() => onFilterToggle(!showOnlyOriginal)}
          size="sm"
          variant={showOnlyOriginal ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon
            icon="heroicons:shield-check"
            className="h-4 w-4"
            inline={true}
          />
          OG Only
        </Button>
        <Button
          onClick={() => onNonOriginalFilterToggle(!showOnlyNonOriginal)}
          size="sm"
          variant={showOnlyNonOriginal ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon
            icon="heroicons:shield-exclamation"
            className="h-4 w-4"
            inline={true}
          />
          Non-OG Only
        </Button>
        <Button
          onClick={() => onSignedFilterToggle(!showOnlySigned)}
          size="sm"
          variant={showOnlySigned ? "default" : "secondary"}
          className="w-fit"
          aria-pressed={showOnlySigned}
        >
          <Icon
            icon="heroicons:pencil-square"
            className="h-4 w-4"
            inline={true}
          />
          Autographed Only
        </Button>
        <Button
          onClick={() => onLimitedFilterToggle(!showOnlyLimited)}
          disabled={showMissingItems}
          title={
            showMissingItems
              ? "Limited filtering needs item metadata for the full missing-item list."
              : undefined
          }
          size="sm"
          variant={showOnlyLimited ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon
            icon="mdi:clock"
            className="h-4 w-4"
            style={{ color: "#ffd700" }}
            inline={true}
          />
          Limiteds Only
        </Button>
        <Button
          onClick={() => onSeasonalFilterToggle(!showOnlySeasonal)}
          disabled={showMissingItems}
          size="sm"
          variant={showOnlySeasonal ? "default" : "secondary"}
          className="w-fit"
        >
          <Icon icon="noto-v1:snowflake" className="h-4 w-4" inline={true} />
          Seasonal Only
        </Button>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="bg-tertiary-bg border-border-card rounded-lg border p-4">
          <div className="flex flex-col gap-4">
            {/* Item Property Checkboxes */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-primary-text text-sm font-medium">
                  Tradability:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tradability"
                      disabled={showMissingItems}
                      checked={!showOnlyTradable && !showOnlyUntradable}
                      onChange={() => {
                        onTradableFilterToggle(false);
                        onUntradableFilterToggle(false);
                        window.rybbit?.event(
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
                      disabled={showMissingItems}
                      checked={showOnlyTradable}
                      onChange={() => {
                        onTradableFilterToggle(true);
                        window.rybbit?.event(
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
                      disabled={showMissingItems}
                      checked={showOnlyUntradable}
                      onChange={() => {
                        onUntradableFilterToggle(true);
                        window.rybbit?.event(
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
                  <label
                    htmlFor="inventory-hide-duplicates"
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      id="inventory-hide-duplicates"
                      checked={hideDuplicates}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        onHideDuplicatesToggle(isChecked);
                        window.rybbit?.event(
                          "Inventory Filter Hide Duplicates Toggle",
                          { active: isChecked },
                        );
                      }}
                    />
                    <span className="text-primary-text text-sm">
                      Hide Duplicates
                    </span>
                  </label>

                  <label
                    htmlFor="inventory-show-missing-items"
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id="inventory-show-missing-items"
                      checked={showMissingItems}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        onShowMissingItemsToggle(isChecked);
                        window.rybbit?.event(
                          "Inventory Filter Show Missing Items Toggle",
                          { active: isChecked },
                        );
                      }}
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
