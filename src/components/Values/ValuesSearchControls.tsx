"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Icon } from "../ui/IconWrapper";
import { FilterSort, ValueSort } from "@/types";
import dynamic from "next/dynamic";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { safeLocalStorage } from "@/utils/safeStorage";

const Slider = dynamic(() => import("@mui/material/Slider"), {
  ssr: false,
  loading: () => (
    <div className="border-border-primary hover:border-border-focus bg-secondary-bg mt-1 h-8 w-full animate-pulse rounded-md border"></div>
  ),
});

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
  const MAX_VALUE_RANGE = 100_000_000;
  const MIN_VALUE_DISTANCE = 4_000_000;

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
    { value: 75_000_000, label: "75M" },
    { value: 100_000_000 },
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
                  className={`text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text w-full rounded-lg border px-4 py-4 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
                    isSearchHighlighted
                      ? "border-button-info bg-button-info/10 shadow-button-info/20 shadow-lg"
                      : isItemIdSearch
                        ? "border-button-info bg-button-info/10 shadow-button-info/20 shadow-lg"
                        : "focus:border-button-info"
                  }`}
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
            </div>

            {/* Filter and Sort dropdowns */}
            <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-4">
              {/* Filter dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select w-full bg-secondary-bg text-primary-text h-[56px] min-h-[56px] font-inter"
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
                    safeLocalStorage.setItem("valuesFilterSort", newValue);
                  }}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="name-all-items">All Items</option>
                  <option value="favorites">My Favorites</option>
                  <option value="name-limited-items">Limited Items</option>
                  <option value="name-seasonal-items">Seasonal Items</option>
                  <option value="name-vehicles">Vehicles</option>
                  <option value="name-spoilers">Spoilers</option>
                  <option value="name-rims">Rims</option>
                  <option value="name-body-colors">Body Colors</option>
                  <option value="name-hyperchromes">HyperChromes</option>
                  <option value="name-textures">Body Textures</option>
                  <option value="name-tire-stickers">Tire Stickers</option>
                  <option value="name-tire-styles">Tire Styles</option>
                  <option value="name-drifts">Drifts</option>
                  <option value="name-furnitures">Furniture</option>
                  <option value="name-horns">Horns</option>
                  <option value="name-weapon-skins">Weapon Skins</option>
                </select>
              </div>

              {/* Sort dropdown */}
              <div className="w-full lg:w-1/2">
                <select
                  className="select w-full bg-secondary-bg text-primary-text h-[56px] min-h-[56px] font-inter"
                  value={valueSort}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newValue = e.target.value as ValueSort;
                    setValueSort(newValue);
                    safeLocalStorage.setItem("valuesValueSort", newValue);
                  }}
                >
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
                    Alphabetically
                  </option>
                  <option value="alpha-asc">Name (A to Z)</option>
                  <option value="alpha-desc">Name (Z to A)</option>
                  <option value="" disabled>
                    Values
                  </option>
                  <option value="cash-desc">Cash Value (High to Low)</option>
                  <option value="cash-asc">Cash Value (Low to High)</option>
                  <option value="duped-desc">Duped Value (High to Low)</option>
                  <option value="duped-asc">Duped Value (Low to High)</option>
                  <option value="" disabled>
                    Trading Metrics
                  </option>
                  <option value="times-traded-desc">
                    Times Traded (High to Low)
                  </option>
                  <option value="times-traded-asc">
                    Times Traded (Low to High)
                  </option>
                  <option value="unique-circulation-desc">
                    Unique Circulation (High to Low)
                  </option>
                  <option value="unique-circulation-asc">
                    Unique Circulation (Low to High)
                  </option>
                  <option value="demand-multiple-desc">
                    Demand Multiple (High to Low)
                  </option>
                  <option value="demand-multiple-asc">
                    Demand Multiple (Low to High)
                  </option>
                  <option value="" disabled>
                    Demand
                  </option>
                  <option value="demand-desc">Demand (High to Low)</option>
                  <option value="demand-asc">Demand (Low to High)</option>
                  <option value="demand-extremely-high">
                    Extremely High Demand
                  </option>
                  <option value="demand-very-high">Very High Demand</option>
                  <option value="demand-high">High Demand</option>
                  <option value="demand-decent">Decent Demand</option>
                  <option value="demand-medium">Medium Demand</option>
                  <option value="demand-low">Low Demand</option>
                  <option value="demand-very-low">Very Low Demand</option>
                  <option value="demand-close-to-none">Close to None</option>
                  <option value="" disabled>
                    Trend
                  </option>
                  <option value="trend-dropping">Dropping Trend</option>
                  <option value="trend-unstable">Unstable Trend</option>
                  <option value="trend-hoarded">Hoarded Trend</option>
                  <option value="trend-manipulated">Manipulated Trend</option>
                  <option value="trend-stable">Stable Trend</option>
                  <option value="trend-recovering">Recovering Trend</option>
                  <option value="trend-rising">Rising Trend</option>
                  <option value="trend-hyped">Hyped Trend</option>
                </select>
              </div>
            </div>
          </div>

          {/* Value range slider */}
          <div className="w-full">
            <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-secondary-text text-xs">
                    Value Range
                  </span>
                </div>
                <span className="text-secondary-text text-[11px]">
                  {rangeValue[0].toLocaleString()} -{" "}
                  {rangeValue[1] >= MAX_VALUE_RANGE
                    ? `${MAX_VALUE_RANGE.toLocaleString()}+`
                    : rangeValue[1].toLocaleString()}
                </span>
              </div>
              <div className="px-1">
                <Slider
                  key="value-range-slider"
                  value={rangeValue}
                  onChange={(_, newValue, activeThumb) => {
                    if (!Array.isArray(newValue)) return;
                    // Clamp only the active thumb; do NOT push the other thumb
                    if (activeThumb === 0) {
                      const clampedMin = Math.min(
                        newValue[0],
                        rangeValue[1] - MIN_VALUE_DISTANCE,
                      );
                      setRangeValue([Math.max(0, clampedMin), rangeValue[1]]);
                    } else if (activeThumb === 1) {
                      const clampedMax = Math.max(
                        newValue[1],
                        rangeValue[0] + MIN_VALUE_DISTANCE,
                      );
                      setRangeValue([
                        rangeValue[0],
                        Math.min(MAX_VALUE_RANGE, clampedMax),
                      ]);
                    }
                  }}
                  onChangeCommitted={(_, newValue) => {
                    if (!Array.isArray(newValue)) return;
                    // Use the clamped state values to avoid raw event values like [0,0]
                    setAppliedMinValue(rangeValue[0]);
                    setAppliedMaxValue(rangeValue[1]);
                  }}
                  valueLabelDisplay="off"
                  min={0}
                  max={MAX_VALUE_RANGE}
                  step={50_000}
                  marks={sliderMarks}
                  disableSwap
                  sx={{
                    color: "var(--color-button-info)",
                    mt: 1,
                    "& .MuiSlider-markLabel": {
                      color: "var(--color-secondary-text)",
                    },
                    "& .MuiSlider-mark": {
                      backgroundColor: "var(--color-secondary-text)",
                    },
                  }}
                />
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
            <kbd className="kbd kbd-sm bg-tertiary-bg text-primary-text border-border-primary">
              Ctrl
            </kbd>
            {" + "}
            <kbd className="kbd kbd-sm bg-tertiary-bg text-primary-text border-border-primary">
              F
            </kbd>{" "}
            to quickly focus the search
          </div>
        </div>
      </div>
    </>
  );
}
