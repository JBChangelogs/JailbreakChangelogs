"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "../ui/IconWrapper";
import { FilterSort, ValueSort } from "@/types";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { safeSessionStorage } from "@/utils/safeStorage";

import { Slider } from "@/components/ui/slider";

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
  setAppliedMaxValue: (value: number) => void;
  searchSectionRef: React.RefObject<HTMLDivElement | null>;
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
}: ValuesSearchControlsProps) {
  const isAuthenticated = useIsAuthenticated();
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const MAX_VALUE_RANGE = 50_000_000;
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

  const getFilterDisplayName = (filterSort: string): string => {
    const filterMap: Record<string, string> = {
      "name-all-items": "items",
      favorites: "favorites",
      "name-limited-items": "limited items",
      "name-seasonal-items": "seasonal items",
      "name-vehicles": "vehicles",
      "name-spoilers": "spoilers",
      "name-rims": "rims",
      "name-body-colors": "body colors",
      "name-hyperchromes": "hyperchromes",
      "name-textures": "body textures",
      "name-tire-stickers": "tire stickers",
      "name-tire-styles": "tire styles",
      "name-drifts": "drifts",
      "name-furnitures": "furniture",
      "name-horns": "horns",
      "name-weapon-skins": "weapon skins",
    };

    return (
      filterMap[filterSort] ||
      filterSort
        .replace("name-", "")
        .replace("-items", "")
        .replace(/-/g, " ")
        .toLowerCase()
    );
  };

  const sliderMarks = [
    { value: 10_000_000, label: "10M" },
    { value: 25_000_000, label: "25M" },
    { value: 50_000_000, label: "50M" },
  ];

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
                  className={`border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus w-full rounded-lg border px-4 py-4 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
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
                <select
                  className="select font-inter bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
                  value={filterSort}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newValue = e.target.value as FilterSort;
                    if (newValue === "favorites") {
                      if (!isAuthenticated) {
                        toast.error("Please log in to view your favorites");
                        return;
                      }
                    }
                    setFilterSort(newValue);
                    safeSessionStorage.setItem("valuesFilterSort", newValue);
                    window.umami?.track("Values Filter Change", {
                      filter: newValue,
                    });
                  }}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="name-all-items">All Items</option>
                  <option value="favorites">My Favorites</option>
                  <option value="name-body-colors">Body Colors</option>
                  <option value="name-textures">Body Textures</option>
                  <option value="name-drifts">Drifts</option>
                  <option value="name-furnitures">Furniture</option>
                  <option value="name-horns">Horns</option>
                  <option value="name-hyperchromes">HyperChromes</option>
                  <option value="name-limited-items">Limited Items</option>
                  <option value="name-rims">Rims</option>
                  <option value="name-seasonal-items">Seasonal Items</option>
                  <option value="name-spoilers">Spoilers</option>
                  <option value="name-tire-stickers">Tire Stickers</option>
                  <option value="name-tire-styles">Tire Styles</option>
                  <option value="name-vehicles">Vehicles</option>
                  <option value="name-weapon-skins">Weapon Skins</option>
                </select>
              </div>

              {/* Sort dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select font-inter bg-secondary-bg text-primary-text h-[56px] min-h-[56px] w-full"
                  value={valueSort}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newValue = e.target.value as ValueSort;
                    setValueSort(newValue);
                    safeSessionStorage.setItem("valuesValueSort", newValue);
                    window.umami?.track("Values Sort Change", {
                      sort: newValue,
                    });
                  }}
                >
                  <option value="" disabled>
                    Alphabetically
                  </option>
                  <option value="alpha-asc">Name (A to Z)</option>
                  <option value="alpha-desc">Name (Z to A)</option>

                  <option value="" disabled>
                    Demand
                  </option>
                  <option value="demand-desc">Demand (High to Low)</option>
                  <option value="demand-asc">Demand (Low to High)</option>
                  <option value="demand-close-to-none">Close to None</option>
                  <option value="demand-decent">Decent Demand</option>
                  <option value="demand-extremely-high">
                    Extremely High Demand
                  </option>
                  <option value="demand-high">High Demand</option>
                  <option value="demand-low">Low Demand</option>
                  <option value="demand-medium">Medium Demand</option>
                  <option value="demand-very-high">Very High Demand</option>
                  <option value="demand-very-low">Very Low Demand</option>

                  <option value="" disabled>
                    Display
                  </option>
                  <option value="random">Random</option>

                  <option value="" disabled>
                    Last Updated
                  </option>
                  <option value="last-updated-desc">
                    Last Updated (Newest to Oldest)
                  </option>
                  <option value="last-updated-asc">
                    Last Updated (Oldest to Newest)
                  </option>

                  <option value="" disabled>
                    Trend
                  </option>
                  <option value="trend-dropping">Dropping Trend</option>
                  <option value="trend-hoarded">Hoarded Trend</option>
                  <option value="trend-hyped">Hyped Trend</option>
                  <option value="trend-manipulated">Manipulated Trend</option>
                  <option value="trend-recovering">Recovering Trend</option>
                  <option value="trend-rising">Rising Trend</option>
                  <option value="trend-stable">Stable Trend</option>
                  <option value="trend-unstable">Unstable Trend</option>

                  <option value="" disabled>
                    Values
                  </option>
                  <option value="cash-desc">Cash Value (High to Low)</option>
                  <option value="cash-asc">Cash Value (Low to High)</option>
                  <option value="duped-desc">Duped Value (High to Low)</option>
                  <option value="duped-asc">Duped Value (Low to High)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border px-3 py-2">
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
                      className="border-border-primary bg-primary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
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
                          Math.min(val, MAX_VALUE_RANGE),
                        );
                        const newRange = [localRange[0], val];
                        setLocalRange(newRange);
                        setRangeValue(newRange);
                        setAppliedMinValue(localRange[0]);
                        setAppliedMaxValue(val);
                        setMaxInput(val.toLocaleString());
                      }}
                      className="border-border-primary bg-primary-bg text-primary-text focus:border-button-info h-7 w-20 rounded border px-2 text-[11px] focus:outline-none"
                      placeholder="Max"
                    />
                  </div>
                  <span className="text-secondary-text text-[11px] whitespace-nowrap">
                    {localRange[0].toLocaleString()} -{" "}
                    {localRange[1] >= MAX_VALUE_RANGE
                      ? `${MAX_VALUE_RANGE.toLocaleString()}+`
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
                  max={MAX_VALUE_RANGE}
                  step={50_000}
                />
                <div className="relative mt-2 h-4 w-full">
                  {sliderMarks.map((mark) => (
                    <div
                      key={mark.value}
                      className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                      style={{
                        left: `${(mark.value / MAX_VALUE_RANGE) * 100}%`,
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
            <kbd className="kbd kbd-sm border-border-primary bg-tertiary-bg text-primary-text">
              Ctrl
            </kbd>
            {" + "}
            <kbd className="kbd kbd-sm border-border-primary bg-tertiary-bg text-primary-text">
              F
            </kbd>{" "}
            to quickly focus the search
          </div>
        </div>
      </div>
    </>
  );
}
