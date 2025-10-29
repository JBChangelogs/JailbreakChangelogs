"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

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
  availableCategories: string[];
  onFilterToggle: (checked: boolean) => void;
  onNonOriginalFilterToggle: (checked: boolean) => void;
  onHideDuplicatesToggle: (checked: boolean) => void;
  onShowMissingItemsToggle: (checked: boolean) => void;
  onLimitedFilterToggle: (checked: boolean) => void;
  onSeasonalFilterToggle: (checked: boolean) => void;
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
  availableCategories,
  onFilterToggle,
  onNonOriginalFilterToggle,
  onHideDuplicatesToggle,
  onShowMissingItemsToggle,
  onLimitedFilterToggle,
  onSeasonalFilterToggle,
  sortOrder,
  setSortOrder,
}: InventoryFiltersProps) {
  const MAX_SEARCH_LENGTH = 50;
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
            className="text-primary-text border-border-primary bg-primary-bg placeholder-secondary-text focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>

        {/* Category Filter - Second */}
        <div className="w-full sm:w-1/3">
          <select
            className="select w-full bg-primary-bg text-primary-text min-h-[56px]"
            value={selectedCategories.length > 0 ? selectedCategories[0] : ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setSelectedCategories([]);
              } else {
                setSelectedCategories([e.target.value]);
              }
            }}
          >
            <option value="">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter - Third */}
        <div className="w-full sm:w-1/3">
          <select
            className="select w-full bg-primary-bg text-primary-text min-h-[56px]"
            value={sortOrder}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortOrder(e.target.value as SortOrder)
            }
          >
            <option disabled>Date</option>
            <option value="created-asc">Oldest First</option>
            <option value="created-desc">Newest First</option>
            <option disabled>Values</option>
            <option value="cash-desc">Cash Value (High to Low)</option>
            <option value="cash-asc">Cash Value (Low to High)</option>
            <option value="duped-desc">Duped Value (High to Low)</option>
            <option value="duped-asc">Duped Value (Low to High)</option>
            <option disabled>Alphabetically</option>
            <option value="alpha-asc">A-Z</option>
            <option value="alpha-desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle Button */}
      <button
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className="text-link0-hover flex cursor-pointer items-center gap-2 text-sm font-medium"
      >
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            showAdvancedFilters ? "rotate-180" : ""
          }`}
        />
        Advanced Filters
      </button>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="border-border-primary bg-primary-bg/50 rounded-lg border p-4">
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
                    onChange={() => onFilterToggle(true)}
                    className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer"
                  />
                  <span className="text-primary-text text-sm">Original</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={showOnlyNonOriginal}
                    onChange={() => onNonOriginalFilterToggle(true)}
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
                  Other:
                </span>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={hideDuplicates}
                      onChange={(e) => onHideDuplicatesToggle(e.target.checked)}
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
                      onChange={(e) =>
                        onShowMissingItemsToggle(e.target.checked)
                      }
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
