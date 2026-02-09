"use client";

import { Icon } from "@/components/ui/IconWrapper";
import { DupeFinderItem } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DupeFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  initialData: DupeFinderItem[];
  hasDuplicates: boolean;
}

export default function DupeFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  sortOrder,
  setSortOrder,
  initialData,
  hasDuplicates,
}: DupeFiltersProps) {
  const MAX_SEARCH_LENGTH = 50;

  // Get available categories
  const availableCategories = Array.from(
    new Set(initialData.map((item) => item.categoryTitle)),
  ).sort();
  const selectedCategoryValue = selectedCategories[0] ?? "all";

  const sortLabels: Record<string, string> = {
    duplicates: "Group Duplicates",
    "alpha-asc": "Name (A to Z)",
    "alpha-desc": "Name (Z to A)",
    "created-desc": "Logged On (Newest to Oldest)",
    "created-asc": "Logged On (Oldest to Newest)",
    "duped-desc": "Dupe Value (High to Low)",
    "duped-asc": "Dupe Value (Low to High)",
  };

  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        Filter & Sort
      </h2>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        {/* Search Bar */}
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

        {/* Category Filter */}
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
                  window.umami?.track("Dupe Search Category Change", {
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

        {/* Sort Filter */}
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
                  setSortOrder(val);
                  window.umami?.track("Dupe Search Sort Change", { sort: val });
                }}
              >
                {hasDuplicates && (
                  <DropdownMenuRadioItem
                    value="duplicates"
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    Group Duplicates
                  </DropdownMenuRadioItem>
                )}
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Alphabetically
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="alpha-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Name (A to Z)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="alpha-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Name (Z to A)
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Date
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="created-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Logged On (Newest to Oldest)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="created-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Logged On (Oldest to Newest)
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Value
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="duped-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Dupe Value (High to Low)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="duped-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Dupe Value (Low to High)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
