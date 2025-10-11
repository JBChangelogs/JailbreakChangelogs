"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FilterSort, ValueSort } from "@/types";
import dynamic from "next/dynamic";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

const Select = dynamic(() => import("react-select"), { ssr: false });

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
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [isSearchHighlighted, setIsSearchHighlighted] = useState(false);
  const [isItemIdSearch, setIsItemIdSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const MAX_VALUE_RANGE = 100_000_000;
  const MIN_VALUE_DISTANCE = 4_000_000;

  const sliderMarks = [
    { value: 10_000_000, label: "10M" },
    { value: 25_000_000, label: "25M" },
    { value: 50_000_000, label: "50M" },
    { value: 75_000_000, label: "75M" },
    { value: 100_000_000 },
  ];

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setSelectLoaded(true);
    });
  }, []);

  // Detect if search term uses id: syntax (item ID search)
  useEffect(() => {
    const isIdSearch = /^id:\s*\d*$/i.test(searchTerm.trim());
    setIsItemIdSearch(isIdSearch && searchTerm.trim() !== "");
  }, [searchTerm]);

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
                  placeholder={`Search ${filterSort === "name-all-items" ? "items" : filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ").toLowerCase()}...`}
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
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-4 lg:flex-1">
              {/* Filter dropdown */}
              <div className="w-full lg:w-1/2">
                {selectLoaded ? (
                  <Select
                    key="filter-select"
                    value={{
                      value: filterSort,
                      label: (() => {
                        switch (filterSort) {
                          case "name-all-items":
                            return "All Items";
                          case "favorites":
                            return "My Favorites";
                          case "name-limited-items":
                            return "Limited Items";
                          case "name-seasonal-items":
                            return "Seasonal Items";
                          case "name-vehicles":
                            return "Vehicles";
                          case "name-spoilers":
                            return "Spoilers";
                          case "name-rims":
                            return "Rims";
                          case "name-body-colors":
                            return "Body Colors";
                          case "name-hyperchromes":
                            return "HyperChromes";
                          case "name-textures":
                            return "Body Textures";
                          case "name-tire-stickers":
                            return "Tire Stickers";
                          case "name-tire-styles":
                            return "Tire Styles";
                          case "name-drifts":
                            return "Drifts";
                          case "name-furnitures":
                            return "Furniture";
                          case "name-horns":
                            return "Horns";
                          case "name-weapon-skins":
                            return "Weapon Skins";
                          default:
                            return filterSort;
                        }
                      })(),
                    }}
                    onChange={(option: unknown) => {
                      if (!option) {
                        // Reset to original value when cleared
                        setFilterSort("name-all-items");
                        localStorage.setItem(
                          "valuesFilterSort",
                          "name-all-items",
                        );
                        return;
                      }
                      const newValue = (option as { value: FilterSort }).value;
                      if (newValue === "favorites") {
                        if (!isAuthenticated) {
                          toast.error("Please log in to view your favorites");
                          return;
                        }
                      }
                      setFilterSort(newValue);
                      localStorage.setItem("valuesFilterSort", newValue);
                    }}
                    options={[
                      { value: "name-all-items", label: "All Items" },
                      { value: "favorites", label: "My Favorites" },
                      { value: "name-limited-items", label: "Limited Items" },
                      {
                        value: "name-seasonal-items",
                        label: "Seasonal Items",
                      },
                      { value: "name-vehicles", label: "Vehicles" },
                      { value: "name-spoilers", label: "Spoilers" },
                      { value: "name-rims", label: "Rims" },
                      { value: "name-body-colors", label: "Body Colors" },
                      { value: "name-hyperchromes", label: "HyperChromes" },
                      { value: "name-textures", label: "Body Textures" },
                      { value: "name-tire-stickers", label: "Tire Stickers" },
                      { value: "name-tire-styles", label: "Tire Styles" },
                      { value: "name-drifts", label: "Drifts" },
                      { value: "name-furnitures", label: "Furniture" },
                      { value: "name-horns", label: "Horns" },
                      { value: "name-weapon-skins", label: "Weapon Skins" },
                    ]}
                    className="w-full"
                    isClearable={true}
                    unstyled
                    classNames={{
                      control: () =>
                        "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg p-3 min-h-[56px] hover:cursor-pointer focus-within:border-button-info",
                      singleValue: () => "text-secondary-text",
                      placeholder: () => "text-secondary-text",
                      menu: () =>
                        "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
                      option: ({ isSelected, isFocused }) =>
                        `px-4 py-3 cursor-pointer ${
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
                    }}
                    isSearchable={false}
                  />
                ) : (
                  <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="w-full lg:w-1/2">
                {selectLoaded ? (
                  <Select
                    key="sort-select"
                    value={{
                      value: valueSort,
                      label: (() => {
                        switch (valueSort) {
                          case "random":
                            return "Random";
                          case "last-updated-desc":
                            return "Last Updated (Newest to Oldest)";
                          case "last-updated-asc":
                            return "Last Updated (Oldest to Newest)";
                          case "alpha-asc":
                            return "Name (A to Z)";
                          case "alpha-desc":
                            return "Name (Z to A)";
                          case "cash-desc":
                            return "Cash Value (High to Low)";
                          case "cash-asc":
                            return "Cash Value (Low to High)";
                          case "duped-desc":
                            return "Duped Value (High to Low)";
                          case "duped-asc":
                            return "Duped Value (Low to High)";
                          case "demand-desc":
                            return "Demand (High to Low)";
                          case "demand-asc":
                            return "Demand (Low to High)";
                          case "demand-extremely-high":
                            return "Extremely High Demand";
                          case "demand-very-high":
                            return "Very High Demand";
                          case "demand-high":
                            return "High Demand";
                          case "demand-decent":
                            return "Decent Demand";
                          case "demand-medium":
                            return "Medium Demand";
                          case "demand-low":
                            return "Low Demand";
                          case "demand-very-low":
                            return "Very Low Demand";
                          case "demand-close-to-none":
                            return "Close to None";
                          case "trend-avoided":
                            return "Avoided Trend";
                          case "trend-dropping":
                            return "Dropping Trend";
                          case "trend-unstable":
                            return "Unstable Trend";
                          case "trend-hoarded":
                            return "Hoarded Trend";
                          case "trend-projected":
                            return "Projected Trend";
                          case "trend-stable":
                            return "Stable Trend";
                          case "trend-recovering":
                            return "Recovering Trend";
                          case "trend-rising":
                            return "Rising Trend";
                          case "trend-hyped":
                            return "Hyped Trend";
                          case "times-traded-desc":
                            return "Times Traded (High to Low)";
                          case "times-traded-asc":
                            return "Times Traded (Low to High)";
                          case "unique-circulation-desc":
                            return "Unique Circulation (High to Low)";
                          case "unique-circulation-asc":
                            return "Unique Circulation (Low to High)";
                          case "demand-multiple-desc":
                            return "Demand Multiple (High to Low)";
                          case "demand-multiple-asc":
                            return "Demand Multiple (Low to High)";
                          default:
                            return valueSort;
                        }
                      })(),
                    }}
                    onChange={(option: unknown) => {
                      if (!option) {
                        // Reset to original value when cleared
                        setValueSort("cash-desc");
                        localStorage.setItem("valuesValueSort", "cash-desc");
                        return;
                      }
                      const newValue = (option as { value: ValueSort }).value;
                      setValueSort(newValue);
                      localStorage.setItem("valuesValueSort", newValue);
                    }}
                    options={[
                      {
                        label: "Display",
                        options: [{ value: "random", label: "Random" }],
                      },
                      {
                        label: "Last Updated",
                        options: [
                          {
                            value: "last-updated-desc",
                            label: "Last Updated (Newest to Oldest)",
                          },
                          {
                            value: "last-updated-asc",
                            label: "Last Updated (Oldest to Newest)",
                          },
                        ],
                      },
                      {
                        label: "Alphabetically",
                        options: [
                          { value: "alpha-asc", label: "Name (A to Z)" },
                          { value: "alpha-desc", label: "Name (Z to A)" },
                        ],
                      },
                      {
                        label: "Values",
                        options: [
                          {
                            value: "cash-desc",
                            label: "Cash Value (High to Low)",
                          },
                          {
                            value: "cash-asc",
                            label: "Cash Value (Low to High)",
                          },
                          {
                            value: "duped-desc",
                            label: "Duped Value (High to Low)",
                          },
                          {
                            value: "duped-asc",
                            label: "Duped Value (Low to High)",
                          },
                        ],
                      },
                      {
                        label: "Trading Metrics",
                        options: [
                          {
                            value: "times-traded-desc",
                            label: "Times Traded (High to Low)",
                          },
                          {
                            value: "times-traded-asc",
                            label: "Times Traded (Low to High)",
                          },
                          {
                            value: "unique-circulation-desc",
                            label: "Unique Circulation (High to Low)",
                          },
                          {
                            value: "unique-circulation-asc",
                            label: "Unique Circulation (Low to High)",
                          },
                          {
                            value: "demand-multiple-desc",
                            label: "Demand Multiple (High to Low)",
                          },
                          {
                            value: "demand-multiple-asc",
                            label: "Demand Multiple (Low to High)",
                          },
                        ],
                      },
                      {
                        label: "Demand",
                        options: [
                          {
                            value: "demand-desc",
                            label: "Demand (High to Low)",
                          },
                          {
                            value: "demand-asc",
                            label: "Demand (Low to High)",
                          },
                          {
                            value: "demand-extremely-high",
                            label: "Extremely High Demand",
                          },
                          {
                            value: "demand-very-high",
                            label: "Very High Demand",
                          },
                          { value: "demand-high", label: "High Demand" },
                          { value: "demand-decent", label: "Decent Demand" },
                          { value: "demand-medium", label: "Medium Demand" },
                          { value: "demand-low", label: "Low Demand" },
                          {
                            value: "demand-very-low",
                            label: "Very Low Demand",
                          },
                          {
                            value: "demand-close-to-none",
                            label: "Close to None",
                          },
                        ],
                      },
                      {
                        label: "Trend",
                        options: [
                          { value: "trend-avoided", label: "Avoided Trend" },
                          {
                            value: "trend-dropping",
                            label: "Dropping Trend",
                          },
                          {
                            value: "trend-unstable",
                            label: "Unstable Trend",
                          },
                          { value: "trend-hoarded", label: "Hoarded Trend" },
                          {
                            value: "trend-projected",
                            label: "Projected Trend",
                          },
                          { value: "trend-stable", label: "Stable Trend" },
                          {
                            value: "trend-recovering",
                            label: "Recovering Trend",
                          },
                          { value: "trend-rising", label: "Rising Trend" },
                          { value: "trend-hyped", label: "Hyped Trend" },
                        ],
                      },
                    ]}
                    className="w-full"
                    isClearable={true}
                    unstyled
                    classNames={{
                      control: () =>
                        "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg p-3 min-h-[56px] hover:cursor-pointer focus-within:border-button-info",
                      singleValue: () => "text-secondary-text",
                      placeholder: () => "text-secondary-text",
                      menu: () =>
                        "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
                      option: ({ isSelected, isFocused }) =>
                        `px-4 py-3 cursor-pointer ${
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
                    isSearchable={false}
                  />
                ) : (
                  <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
                )}
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

          {/* Pro tip about Ctrl+F */}
          <div className="text-secondary-text mt-2 hidden items-center gap-1 text-xs lg:flex">
            💡 Pro tip: Press Ctrl+F to quickly focus the search
          </div>
        </div>
      </div>
    </>
  );
}
