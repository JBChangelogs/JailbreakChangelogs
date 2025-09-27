"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

type SortOrder =
  | "duplicates"
  | "alpha-asc"
  | "alpha-desc"
  | "created-asc"
  | "created-desc"
  | "cash-desc"
  | "cash-asc";

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
  availableCategories: string[];
  onFilterToggle: (checked: boolean) => void;
  onNonOriginalFilterToggle: (checked: boolean) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  hasDuplicates: boolean;
}

export default function InventoryFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  showOnlyOriginal,
  showOnlyNonOriginal,
  availableCategories,
  onFilterToggle,
  onNonOriginalFilterToggle,
  sortOrder,
  setSortOrder,
  hasDuplicates,
}: InventoryFiltersProps) {
  const [selectLoaded, setSelectLoaded] = useState(false);
  const MAX_SEARCH_LENGTH = 50;

  // Load Select component
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  return (
    <div className="mb-4 flex flex-col gap-4">
      {/* Filter Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showOnlyOriginal}
            onChange={(e) => onFilterToggle(e.target.checked)}
            className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
          />
          <span className="text-primary-text text-sm">Original Items Only</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showOnlyNonOriginal}
            onChange={(e) => onNonOriginalFilterToggle(e.target.checked)}
            className="text-button-info focus:ring-button-info h-4 w-4 cursor-pointer rounded"
          />
          <span className="text-primary-text text-sm">
            Non-Original Items Only
          </span>
        </label>
      </div>

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
              className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>

        {/* Category Filter - Second */}
        <div className="w-full sm:w-1/3">
          {selectLoaded ? (
            <Select
              value={
                selectedCategories.length > 0
                  ? {
                      value: selectedCategories[0],
                      label: selectedCategories[0],
                    }
                  : null
              }
              onChange={(option) => {
                if (!option) {
                  setSelectedCategories([]);
                  return;
                }
                setSelectedCategories([(option as { value: string }).value]);
              }}
              options={availableCategories.map((cat) => ({
                value: cat,
                label: cat,
              }))}
              classNamePrefix="react-select"
              className="w-full"
              isMulti={false}
              isClearable={true}
              isSearchable={false}
              placeholder="Filter by category..."
              unstyled
              classNames={{
                control: () =>
                  "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary bg-primary-bg p-3 min-h-[56px] hover:cursor-pointer focus-within:border-button-info",
                singleValue: () => "text-secondary-text",
                placeholder: () => "text-secondary-text",
                menu: () =>
                  "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary bg-secondary-bg shadow-lg",
                option: ({ isSelected, isFocused, isDisabled }) =>
                  `px-4 py-3 ${
                    isDisabled
                      ? "cursor-not-allowed text-secondary-text opacity-50"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "bg-button-info text-form-button-text"
                      : isFocused
                        ? "bg-quaternary-bg text-primary-text"
                        : "bg-secondary-bg text-secondary-text"
                  }`,
                clearIndicator: () =>
                  "text-secondary-text hover:text-primary-text cursor-pointer",
                dropdownIndicator: () =>
                  "text-secondary-text hover:text-primary-text cursor-pointer",
                groupHeading: () =>
                  "px-4 py-2 text-primary-text font-semibold text-sm",
              }}
            />
          ) : (
            <div className="border-border-primary bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
          )}
        </div>

        {/* Sort Filter - Third */}
        <div className="w-full sm:w-1/3">
          {selectLoaded ? (
            <Select
              value={{
                value: sortOrder,
                label:
                  sortOrder === "duplicates"
                    ? "Duplicates First"
                    : sortOrder === "alpha-asc"
                      ? "A-Z"
                      : sortOrder === "alpha-desc"
                        ? "Z-A"
                        : sortOrder === "created-asc"
                          ? "Oldest First"
                          : sortOrder === "created-desc"
                            ? "Newest First"
                            : sortOrder === "cash-desc"
                              ? "Cash Value (High to Low)"
                              : sortOrder === "cash-asc"
                                ? "Cash Value (Low to High)"
                                : "Sort by...",
              }}
              onChange={(option) => {
                if (option) {
                  setSortOrder((option as { value: SortOrder }).value);
                }
              }}
              options={[
                ...(hasDuplicates
                  ? [{ value: "duplicates", label: "Group Duplicates" }]
                  : []),
                {
                  label: "Date",
                  options: [
                    { value: "created-asc", label: "Oldest First" },
                    { value: "created-desc", label: "Newest First" },
                  ],
                },
                {
                  label: "Values",
                  options: [
                    { value: "cash-desc", label: "Cash Value (High to Low)" },
                    { value: "cash-asc", label: "Cash Value (Low to High)" },
                  ],
                },
                {
                  label: "Alphabetically",
                  options: [
                    { value: "alpha-asc", label: "A-Z" },
                    { value: "alpha-desc", label: "Z-A" },
                  ],
                },
              ]}
              classNamePrefix="react-select"
              className="w-full"
              isMulti={false}
              isClearable={true}
              isSearchable={false}
              placeholder="Sort by..."
              unstyled
              classNames={{
                control: () =>
                  "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary bg-primary-bg p-3 min-h-[56px] hover:cursor-pointer focus-within:border-button-info",
                singleValue: () => "text-secondary-text",
                placeholder: () => "text-secondary-text",
                menu: () =>
                  "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary bg-secondary-bg shadow-lg",
                option: ({ isSelected, isFocused, isDisabled }) =>
                  `px-4 py-3 ${
                    isDisabled
                      ? "cursor-not-allowed text-secondary-text opacity-50"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "bg-button-info text-form-button-text"
                      : isFocused
                        ? "bg-quaternary-bg text-primary-text"
                        : "bg-secondary-bg text-secondary-text"
                  }`,
                clearIndicator: () =>
                  "text-secondary-text hover:text-primary-text cursor-pointer",
                dropdownIndicator: () =>
                  "text-secondary-text hover:text-primary-text cursor-pointer",
                groupHeading: () =>
                  "px-4 py-2 text-primary-text font-semibold text-sm",
              }}
            />
          ) : (
            <div className="border-border-primary bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
          )}
        </div>
      </div>
    </div>
  );
}
