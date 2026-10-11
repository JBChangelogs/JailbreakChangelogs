"use client";

import { isItemSearchShortcut } from "@/utils/ui/searchShortcut";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { FilterSort, ValueSort } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ValueRangeFilter } from "./ValueRangeFilter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ValuesFilterMode } from "@/hooks/useValuesFilterMode";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  advancedFilterGroups,
  chipFilterOptions,
  filterGroups,
  getFilterSortsButtonLabel,
  getFilterSortsDisplayNames,
} from "./valuesFilterOptions";
import { trackFilterSortEvent } from "@/utils/analytics/rybbit";
import { useRouter } from "nextjs-toploader/app";
import { usePartialItems } from "@/hooks/usePartialItems";
import type { PartialItem } from "@/utils/api/api";
import { filterByTypes } from "@/utils/trading/values";
import ValuesSearchSuggestions, {
  VALUES_SUGGESTIONS_ID,
  getItemHref,
  getItemSuggestions,
} from "./ValuesSearchSuggestions";

interface ValuesSearchControlsProps {
  onDebouncedSearchChange: (term: string) => void;
  initialSearchTerm: string;
  clearTrigger: number;
  selectedFilterSorts: FilterSort[];
  onToggleFilterSort: (sort: FilterSort) => void;
  onClearFilterSorts: (subset?: FilterSort[]) => void;
  filterMode: ValuesFilterMode;
  onFilterModeChange: (mode: ValuesFilterMode) => void;
  valueSort: ValueSort;
  setValueSort: (sort: ValueSort) => void;
  valueSortGroups: {
    label: string;
    options: { value: string; label: string }[];
  }[];
  rangeValue: number[];
  setRangeValue: (value: number[]) => void;
  setAppliedMinValue: (value: number) => void;
  appliedMaxValue: number;
  setAppliedMaxValue: (value: number) => void;
  searchSectionRef: React.RefObject<HTMLDivElement | null>;
  maxValueRange: number;
}

export default function ValuesSearchControls({
  onDebouncedSearchChange,
  initialSearchTerm,
  clearTrigger,
  selectedFilterSorts,
  onToggleFilterSort,
  onClearFilterSorts,
  filterMode,
  onFilterModeChange,
  valueSort,
  setValueSort,
  valueSortGroups,
  rangeValue,
  setRangeValue,
  setAppliedMinValue,
  setAppliedMaxValue,
  searchSectionRef,
  maxValueRange,
}: ValuesSearchControlsProps) {
  const isAuthenticated = useIsAuthenticated();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const router = useRouter();
  const [hasFocusedSearch, setHasFocusedSearch] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Set when navigating to a suggestion so the pending debounced search
  // doesn't rewrite the URL on the way out
  const skipSearchCommitRef = useRef(false);
  const { data: partialItems } = usePartialItems(hasFocusedSearch);

  useEffect(() => {
    setSearchTerm((prev) =>
      prev.trim() === initialSearchTerm ? prev : initialSearchTerm,
    );
  }, [initialSearchTerm]);

  useEffect(() => {
    if (skipSearchCommitRef.current) return;
    onDebouncedSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onDebouncedSearchChange]);

  useEffect(() => {
    if (clearTrigger > 0) setSearchTerm("");
  }, [clearTrigger]);

  // Derive isItemIdSearch from searchTerm instead of using useEffect
  const isItemIdSearch =
    /^id:\s*\d*$/i.test(searchTerm.trim()) && searchTerm.trim() !== "";

  const typeFilterValues = useMemo(
    () => filterGroups.flatMap((group) => group.options.map((o) => o.value)),
    [],
  );
  const selectedTypeFilters = useMemo(
    () =>
      selectedFilterSorts.filter((value) => typeFilterValues.includes(value)),
    [selectedFilterSorts, typeFilterValues],
  );
  const filterLabel = getFilterSortsButtonLabel(selectedTypeFilters);

  const sortLabel =
    valueSortGroups
      .flatMap((group) => group.options)
      .find((option) => option.value === valueSort)?.label ?? "Sort by";

  const advancedFilterValues = useMemo(
    () =>
      advancedFilterGroups.flatMap((group) =>
        group.options.map((o) => o.value),
      ),
    [],
  );
  const hasActiveAdvancedFilters = selectedFilterSorts.some((value) =>
    advancedFilterValues.includes(value),
  );

  const suggestions = useMemo(
    () =>
      isItemIdSearch
        ? []
        : getItemSuggestions(
            partialItems && filterByTypes(partialItems, selectedTypeFilters),
            searchTerm,
          ),
    [isItemIdSearch, partialItems, selectedTypeFilters, searchTerm],
  );
  const showSuggestions = isSuggestionsOpen && suggestions.length > 0;
  const showFilterHint =
    isSuggestionsOpen &&
    !isItemIdSearch &&
    suggestions.length === 0 &&
    selectedTypeFilters.length > 0 &&
    getItemSuggestions(partialItems, searchTerm).length > 0;

  const goToItem = (item: PartialItem) => {
    skipSearchCommitRef.current = true;
    setIsSuggestionsOpen(false);
    searchInputRef.current?.blur();
    router.push(getItemHref(item));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && highlightedIndex >= 0) {
        goToItem(suggestions[highlightedIndex]);
        return;
      }
      setIsSuggestionsOpen(false);
      onDebouncedSearchChange(searchTerm);
      return;
    }
    if (!showSuggestions) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setIsSuggestionsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    }
  };

  // Handle / to focus search without overriding browser Find
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isItemSearchShortcut(event) && searchInputRef.current) {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          // Add visual highlight
          setIsSearchHighlighted(true);
          // Remove highlight after 2 seconds
          setTimeout(() => setIsSearchHighlighted(false), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <div ref={searchSectionRef} className="mb-4">
        <div className="flex flex-col gap-6">
          {/* Search and dropdowns row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
            {/* Search input */}
            <div className="w-full lg:w-1/3">
              <div className="mb-2 flex h-6 items-center">
                <span className="text-secondary-text text-xs font-medium">
                  Search items
                </span>
              </div>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  aria-keyshortcuts="/"
                  type="text"
                  placeholder={`Search ${getFilterSortsDisplayNames(selectedFilterSorts) || "All Items"}...`}
                  value={searchTerm}
                  onChange={(e) => {
                    skipSearchCommitRef.current = false;
                    setSearchTerm(e.target.value);
                    setIsSuggestionsOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={() => {
                    setHasFocusedSearch(true);
                    setIsSuggestionsOpen(true);
                  }}
                  onBlur={() => setIsSuggestionsOpen(false)}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={showSuggestions}
                  aria-controls={VALUES_SUGGESTIONS_ID}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    showSuggestions && highlightedIndex >= 0
                      ? `${VALUES_SUGGESTIONS_ID}-${highlightedIndex}`
                      : undefined
                  }
                  className={`border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus h-14 w-full rounded-lg border px-4 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
                    isSearchHighlighted
                      ? "bg-button-info/10 shadow-button-info/20 border-button-info shadow-lg"
                      : isItemIdSearch
                        ? "bg-button-info/10 shadow-button-info/20 border-button-info shadow-lg"
                        : "focus:border-button-info"
                  }`}
                />
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      skipSearchCommitRef.current = false;
                      setSearchTerm("");
                      onDebouncedSearchChange("");
                      searchInputRef.current?.focus();
                    }}
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <Icon icon="heroicons:x-mark" />
                  </button>
                )}
                {showSuggestions && (
                  <ValuesSearchSuggestions
                    suggestions={suggestions}
                    highlightedIndex={highlightedIndex}
                    onHighlight={setHighlightedIndex}
                    onSelect={goToItem}
                  />
                )}
                {showFilterHint && (
                  <div className="border-border-card bg-secondary-bg text-secondary-text absolute top-full left-0 z-40 mt-1 flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm shadow-lg">
                    <span>No matches in {filterLabel}</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onClearFilterSorts(typeFilterValues)}
                      className="text-link hover:text-link-hover shrink-0 cursor-pointer font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter and Sort dropdowns */}
            <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:flex-row lg:gap-4">
              {/* Filter dropdown */}
              <div className="col-span-1 w-full lg:w-1/2">
                <div className="mb-2 flex h-6 items-center justify-between gap-2">
                  <span className="text-secondary-text text-xs font-medium">
                    Category
                  </span>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="values-multi-filter-mode"
                      className="text-secondary-text cursor-pointer text-xs font-medium"
                    >
                      <span className="hidden sm:inline">Multi-select</span>
                      <span className="sm:hidden">Multi</span>
                    </label>
                    <Switch
                      id="values-multi-filter-mode"
                      checked={filterMode === "multi"}
                      onCheckedChange={(checked) =>
                        onFilterModeChange(checked ? "multi" : "single")
                      }
                      aria-label="Allow multiple value filters"
                    />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      id="values-filter-menu-trigger"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 min-h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                      aria-label="Select category"
                    >
                      <span className="truncate">{filterLabel}</span>
                      <Icon
                        icon="heroicons:chevron-down"
                        className="text-secondary-text h-5 w-5"
                        inline={true}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                  >
                    {filterMode === "multi" ? (
                      <>
                        {selectedTypeFilters.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onClearFilterSorts(typeFilterValues)}
                            className="text-link hover:text-link-hover w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium"
                          >
                            Clear Filters
                          </button>
                        )}
                        {filterGroups.map((group, groupIndex) => (
                          <Fragment key={group.label}>
                            <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                              {group.label}
                            </DropdownMenuLabel>
                            {group.options.map((option) => (
                              <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={selectedFilterSorts.includes(
                                  option.value,
                                )}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={() => {
                                  onToggleFilterSort(option.value);
                                  trackFilterSortEvent(
                                    "values",
                                    "filter",
                                    option.value,
                                  );
                                }}
                                className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg py-2 pr-8 pl-3 text-sm"
                              >
                                {option.label}
                              </DropdownMenuCheckboxItem>
                            ))}
                            {groupIndex !== filterGroups.length - 1 && (
                              <DropdownMenuSeparator className="bg-border-primary/60" />
                            )}
                          </Fragment>
                        ))}
                      </>
                    ) : (
                      <DropdownMenuRadioGroup
                        value={selectedTypeFilters[0] ?? "name-all-items"}
                        onValueChange={(newValue) => {
                          if (newValue === "name-all-items") {
                            onClearFilterSorts();
                            return;
                          }
                          const nextValue = newValue as FilterSort;
                          onToggleFilterSort(nextValue);
                          trackFilterSortEvent("values", "filter", nextValue);
                        }}
                      >
                        <DropdownMenuRadioItem
                          value="name-all-items"
                          className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                        >
                          All Items
                        </DropdownMenuRadioItem>
                        {filterGroups.map((group, groupIndex) => (
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
                            {groupIndex !== filterGroups.length - 1 && (
                              <DropdownMenuSeparator className="bg-border-primary/60" />
                            )}
                          </Fragment>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sort dropdown */}
              <div className="col-span-1 w-full lg:w-1/2">
                <div className="mb-2 flex h-6 items-center">
                  <span className="text-secondary-text text-xs font-medium">
                    Sort by
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      id="values-sort-menu-trigger"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 min-h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                      aria-label="Select sort"
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
                    className="border-border-card bg-secondary-bg text-primary-text max-h-90 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                  >
                    {valueSortGroups.length === 0 && (
                      <DropdownMenuLabel className="text-secondary-text px-3 py-2 text-sm">
                        Sort options unavailable
                      </DropdownMenuLabel>
                    )}
                    <DropdownMenuRadioGroup
                      value={valueSort}
                      onValueChange={(newValue) => {
                        const nextValue = newValue as ValueSort;
                        setValueSort(nextValue);
                        trackFilterSortEvent("values", "sort", nextValue);
                      }}
                    >
                      {valueSortGroups.map((group, groupIndex) => (
                        <div key={group.label}>
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
                          {groupIndex !== valueSortGroups.length - 1 && (
                            <DropdownMenuSeparator className="bg-border-primary/60" />
                          )}
                        </div>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              size="sm"
              variant={showAdvancedFilters ? "default" : "secondary"}
            >
              <Icon
                icon="rivet-icons:filter"
                className="h-4 w-4"
                inline={true}
              />
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
            {chipFilterOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={
                  selectedFilterSorts.includes(option.value)
                    ? "default"
                    : "secondary"
                }
                onClick={() => {
                  if (option.value === "favorites" && !isAuthenticated) {
                    toast.info("Please log in to view your favorites");
                    return;
                  }
                  onToggleFilterSort(option.value);
                  trackFilterSortEvent("values", "filter", option.value);
                }}
              >
                <Icon icon={option.icon} style={{ color: option.iconColor }} />
                {option.label}
              </Button>
            ))}
          </div>

          {/* Advanced Filters: Demand and Trend */}
          {showAdvancedFilters && (
            <div className="bg-secondary-bg border-border-card rounded-lg border p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary-text text-sm font-semibold">
                    Advanced Filters
                  </span>
                  <button
                    type="button"
                    onClick={() => onClearFilterSorts(advancedFilterValues)}
                    className={`text-link hover:text-link-hover cursor-pointer text-sm font-medium ${
                      hasActiveAdvancedFilters ? "visible" : "invisible"
                    }`}
                  >
                    Clear Demand & Trend Filters
                  </button>
                </div>
                {advancedFilterGroups.map((group) => (
                  <div key={group.label} className="flex flex-col gap-2">
                    <span className="text-primary-text text-sm font-medium">
                      {group.label}:
                    </span>
                    <div className="flex flex-wrap gap-4">
                      {group.options.map((option) => (
                        <label
                          key={option.value}
                          htmlFor={`advanced-filter-${option.value}`}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Checkbox
                            id={`advanced-filter-${option.value}`}
                            checked={selectedFilterSorts.includes(option.value)}
                            onCheckedChange={() => {
                              onToggleFilterSort(option.value);
                              trackFilterSortEvent(
                                "values",
                                "filter",
                                option.value,
                              );
                            }}
                          />
                          <span className="text-primary-text text-sm">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ValueRangeFilter
            rangeValue={rangeValue}
            maxValueRange={maxValueRange}
            onCommit={(range) => {
              setRangeValue(range);
              setAppliedMinValue(range[0]);
              setAppliedMaxValue(range[1]);
            }}
          />

          {/* Helpful tips about shortcuts */}
          <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
            <Icon
              icon="emojione:light-bulb"
              className="text-sm text-yellow-500"
            />
            Helpful tip: Press{" "}
            <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
              /
            </kbd>{" "}
            to quickly focus the search.
          </div>
        </div>
      </div>
    </>
  );
}
