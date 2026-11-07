"use client";

import { Icon } from "../ui/IconWrapper";
import type { InventorySortGroup } from "./InventoryFilters";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InventoryListControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  availableCategories: string[];
  sortOrder: string;
  setSortOrder: (order: string) => void;
  sortGroups: InventorySortGroup[];
}

export default function InventoryListControls({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  availableCategories,
  sortOrder,
  setSortOrder,
  sortGroups,
}: InventoryListControlsProps) {
  const MAX_SEARCH_LENGTH = 50;
  const selectedCategoryValue = selectedCategories[0] ?? "all";
  const sortLabel =
    sortGroups
      .flatMap((group) => group.options)
      .find((option) => option.value === sortOrder)?.label ?? "Sort";
  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:flex sm:flex-row">
      <div className="col-span-2 w-full sm:w-1/3">
        <div className="mb-2 flex h-6 items-center">
          <span className="text-secondary-text text-xs font-medium">
            Search items
          </span>
        </div>
        <div className="relative">
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
      </div>

      <div className="min-w-0 sm:w-1/3">
        <div className="mb-2 flex h-6 items-center">
          <span className="text-secondary-text text-xs font-medium">
            Category
          </span>
        </div>
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

      <div className="min-w-0 sm:w-1/3">
        <div className="mb-2 flex h-6 items-center">
          <span className="text-secondary-text text-xs font-medium">
            Sort by
          </span>
        </div>
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
  );
}
