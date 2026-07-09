"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { FilterSort, ValueSort } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { valueSortGroups, getValueSortLabel } from "./valuesSortOptions";
import { trackFilterSortEvent } from "@/utils/analytics/rybbit";

interface ValuesSearchControlsProps {
  onDebouncedSearchChange: (term: string) => void;
  clearTrigger: number;
  selectedFilterSorts: FilterSort[];
  onToggleFilterSort: (sort: FilterSort) => void;
  onClearFilterSorts: (subset?: FilterSort[]) => void;
  valueSort: ValueSort;
  setValueSort: (sort: ValueSort) => void;
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
  clearTrigger,
  selectedFilterSorts,
  onToggleFilterSort,
  onClearFilterSorts,
  valueSort,
  setValueSort,
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
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    onDebouncedSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onDebouncedSearchChange]);

  useEffect(() => {
    if (clearTrigger > 0) setSearchTerm("");
  }, [clearTrigger]);

  // Local state for the slider visual position to ensure 60fps movement
  const [localRange, setLocalRange] = useState(rangeValue);
  // Local state for numerical inputs to allow typing
  const [minInput, setMinInput] = useState(rangeValue[0].toLocaleString());
  const [maxInput, setMaxInput] = useState(rangeValue[1].toLocaleString());

  // Helper to strip commas
  const stripCommas = (str: string) => str.replace(/,/g, "");

  // Sync internal states when rangeValue changes (e.g. from parent reset or clear)
  useEffect(() => {
    setLocalRange(rangeValue);
    setMinInput(rangeValue[0].toLocaleString());
    setMaxInput(rangeValue[1].toLocaleString());
  }, [rangeValue]);

  // Also sync inputs when localRange changes from slider movement
  useEffect(() => {
    setMinInput(localRange[0].toLocaleString());
    setMaxInput(localRange[1].toLocaleString());
  }, [localRange]);

  // Derive isItemIdSearch from searchTerm instead of using useEffect
  const isItemIdSearch =
    /^id:\s*\d*$/i.test(searchTerm.trim()) && searchTerm.trim() !== "";

  const sliderMarks = useMemo(() => {
    const marks = [];
    if (maxValueRange >= 10_000_000)
      marks.push({ value: 10_000_000, label: "10M" });
    if (maxValueRange >= 25_000_000)
      marks.push({ value: 25_000_000, label: "25M" });

    // Add marks every 50M if max is large
    if (maxValueRange > 50_000_000) {
      for (let i = 50_000_000; i <= maxValueRange; i += 50_000_000) {
        marks.push({ value: i, label: `${i / 1_000_000}M` });
      }
    } else if (maxValueRange >= 50_000_000) {
      marks.push({ value: 50_000_000, label: "50M" });
    }

    return marks;
  }, [maxValueRange]);

  const snapPoints = useMemo(() => {
    return [0, maxValueRange, ...sliderMarks.map((mark) => mark.value)];
  }, [maxValueRange, sliderMarks]);

  const snapDistance = useMemo(() => {
    return Math.max(100_000, Math.floor(maxValueRange * 0.01));
  }, [maxValueRange]);

  const maybeSnapToPoint = (value: number): number => {
    const nearest = snapPoints.reduce((closest, point) => {
      return Math.abs(point - value) < Math.abs(closest - value)
        ? point
        : closest;
    }, snapPoints[0] ?? value);

    return Math.abs(nearest - value) <= snapDistance ? nearest : value;
  };

  const filterLabel = getFilterSortsButtonLabel(selectedFilterSorts);

  const sortLabel = getValueSortLabel(valueSort);

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

  // Handle Ctrl+F to focus search input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
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
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${getFilterSortsDisplayNames(selectedFilterSorts) || "All Items"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                    onClick={() => setSearchTerm("")}
                    className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <Icon icon="heroicons:x-mark" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Sort dropdowns */}
            <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:flex-row lg:gap-4">
              {/* Filter dropdown */}
              <div className="col-span-1 w-full lg:w-1/2">
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
                    {selectedFilterSorts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onClearFilterSorts()}
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
                            checked={selectedFilterSorts.includes(option.value)}
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sort dropdown */}
              <div className="col-span-1 w-full lg:w-1/2">
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

          <div className="w-full">
            <div className="border-border-card bg-secondary-bg rounded-lg border px-3 py-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-secondary-text text-xs">
                    Value Range
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minInput}
                      onFocus={(e) => {
                        setMinInput(stripCommas(e.target.value));
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setMinInput(val);
                      }}
                      onBlur={() => {
                        let val = parseInt(stripCommas(minInput)) || 0;
                        val = Math.max(0, Math.min(val, localRange[1]));
                        const newRange = [val, localRange[1]];
                        setLocalRange(newRange);
                        setRangeValue(newRange);
                        setAppliedMinValue(val);
                        setAppliedMaxValue(localRange[1]);
                        setMinInput(val.toLocaleString());
                      }}
                      className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
                      placeholder="Min"
                    />
                    <span className="text-secondary-text text-xs">-</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={maxInput}
                      onFocus={(e) => {
                        setMaxInput(stripCommas(e.target.value));
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setMaxInput(val);
                      }}
                      onBlur={() => {
                        let val = parseInt(stripCommas(maxInput)) || 0;
                        val = Math.max(
                          localRange[0],
                          Math.min(val, maxValueRange),
                        );
                        const newRange = [localRange[0], val];
                        setLocalRange(newRange);
                        setRangeValue(newRange);
                        setAppliedMinValue(localRange[0]);
                        setAppliedMaxValue(val);
                        setMaxInput(val.toLocaleString());
                      }}
                      className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
                      placeholder="Max"
                    />
                  </div>
                  <span className="text-secondary-text text-[11px] whitespace-nowrap">
                    {localRange[0].toLocaleString()} -{" "}
                    {localRange[1] >= maxValueRange
                      ? `${maxValueRange.toLocaleString()}+`
                      : localRange[1].toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-2 px-1 py-1">
                <Slider
                  key="value-range-slider"
                  value={localRange}
                  onValueChange={(newValue) => {
                    const snappedRange = [
                      maybeSnapToPoint(newValue[0]),
                      maybeSnapToPoint(newValue[1]),
                    ];
                    setLocalRange([
                      Math.min(snappedRange[0], snappedRange[1]),
                      Math.max(snappedRange[0], snappedRange[1]),
                    ]);
                  }}
                  onValueCommit={(newValue) => {
                    const snappedRange = [
                      maybeSnapToPoint(newValue[0]),
                      maybeSnapToPoint(newValue[1]),
                    ];
                    const normalizedRange = [
                      Math.min(snappedRange[0], snappedRange[1]),
                      Math.max(snappedRange[0], snappedRange[1]),
                    ];
                    setRangeValue(normalizedRange);
                    setAppliedMinValue(normalizedRange[0]);
                    setAppliedMaxValue(normalizedRange[1]);
                  }}
                  min={0}
                  max={maxValueRange}
                  step={50_000}
                />
                <div className="relative mt-2 h-4 w-full">
                  {sliderMarks.map((mark: { value: number; label: string }) => (
                    <div
                      key={mark.value}
                      className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                      style={{
                        left: `${(mark.value / maxValueRange) * 100}%`,
                      }}
                    >
                      <div className="bg-secondary-text mb-1 h-1 w-0.5" />
                      <span className="text-secondary-text text-[10px] leading-none font-medium">
                        {mark.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Helpful tips about shortcuts */}
          <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
            <Icon
              icon="emojione:light-bulb"
              className="text-sm text-yellow-500"
            />
            Helpful tip: Press{" "}
            <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
              Ctrl
            </kbd>
            {" + "}
            <kbd className="kbd kbd-sm border-border-card bg-tertiary-bg text-primary-text">
              F
            </kbd>{" "}
            to quickly focus the search.
          </div>
        </div>
      </div>
    </>
  );
}
