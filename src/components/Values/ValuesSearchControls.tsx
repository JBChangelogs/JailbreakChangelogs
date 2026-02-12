"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/IconWrapper";
import { FilterSort, ValueSort } from "@/types";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
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
  getFilterDisplayName,
} from "./valuesFilterOptions";
import { valueSortGroups, getValueSortLabel } from "./valuesSortOptions";
import { trackFilterSortEvent } from "@/utils/umami";

interface ValuesSearchControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterSort: FilterSort;
  setFilterSort: (sort: FilterSort) => void;
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
  searchTerm,
  setSearchTerm,
  filterSort,
  setFilterSort,
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
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const filterLabel =
    filterOptions.find((option) => option.value === filterSort)?.label ??
    "Select category";

  const sortLabel = getValueSortLabel(valueSort);

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
      <div ref={searchSectionRef} className="mb-8">
        <div className="flex flex-col gap-6">
          {/* Search and dropdowns row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
            {/* Search input */}
            <div className="w-full lg:w-1/3">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${getFilterDisplayName(filterSort)}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus h-[56px] w-full rounded-lg border px-4 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
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
            <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-4">
              {/* Filter dropdown */}
              <div className="w-full lg:w-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      id="values-filter-menu-trigger"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] min-h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
                    className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                  >
                    <DropdownMenuRadioGroup
                      value={filterSort}
                      onValueChange={(newValue) => {
                        const nextValue = newValue as FilterSort;
                        if (nextValue === "favorites" && !isAuthenticated) {
                          toast.error("Please log in to view your favorites");
                          return;
                        }
                        setFilterSort(nextValue);
                        trackFilterSortEvent("values", "filter", nextValue);
                      }}
                    >
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sort dropdown */}
              <div className="w-full lg:w-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      id="values-sort-menu-trigger"
                      className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] min-h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
                    className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[360px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
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
                      className="border-border-card bg-primary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
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
                      className="border-border-card bg-primary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
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
                    setLocalRange(newValue);
                  }}
                  onValueCommit={(newValue) => {
                    setRangeValue(newValue);
                    setAppliedMinValue(newValue[0]);
                    setAppliedMaxValue(newValue[1]);
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

          {/* Helpful tip about Ctrl+F */}
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
            to quickly focus the search
          </div>
        </div>
      </div>
    </>
  );
}
