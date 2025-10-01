"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FilterSort, ValueSort } from "@/types";
import dynamic from "next/dynamic";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
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

/**
 * Render the values search controls: search input, filter and sort selects, and a value range slider (with optional ad column for non‑premium users).
 *
 * The component focuses and highlights the search input when the user presses Ctrl/Cmd+F, enforces a minimum distance between slider thumbs, and persists filter/sort choices to localStorage. Selecting "My Favorites" in the filter requires authentication (shows an error toast when not authenticated).
 *
 * @param searchTerm - Current search input value
 * @param setSearchTerm - Setter for the search input value
 * @param filterSort - Current filter selection key
 * @param setFilterSort - Setter for the filter selection; updates localStorage and validates favorites selection against authentication
 * @param valueSort - Current sort selection key
 * @param setValueSort - Setter for the sort selection; updates localStorage
 * @param rangeValue - Current two‑element range [min, max] used by the slider
 * @param setRangeValue - Setter for the range value while the slider is being dragged
 * @param setAppliedMinValue - Setter invoked when the slider change is committed to apply the current minimum value
 * @param setAppliedMaxValue - Setter invoked when the slider change is committed to apply the current maximum value
 * @param searchSectionRef - Ref attached to the component's root element (used for scrolling/anchor behavior)
 */
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
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
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
    setSelectLoaded(true);
  }, []);

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
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
      <style jsx>{`
        .responsive-ad-container-search {
          width: 320px;
          height: 100px;
          border: 1px solid
            var(--color-border-border-primary hover: border-border-focus);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        @media (min-width: 500px) {
          .responsive-ad-container-search {
            width: 468px;
            height: 60px;
          }
        }

        @media (min-width: 800px) {
          .responsive-ad-container-search {
            width: 468px;
            height: 60px;
          }
        }
      `}</style>
      <div ref={searchSectionRef} className="mb-8">
        <div
          className={
            currentUserPremiumType !== 0 && premiumStatusLoaded
              ? "flex flex-col items-start gap-4 lg:flex-row"
              : "flex flex-col items-start gap-6 lg:flex-row"
          }
        >
          {/* Controls: horizontal row for premium, vertical stack for non-premium */}
          <div className="flex w-full flex-col gap-4 lg:min-w-0 lg:flex-1">
            {/* Top controls row: Search + Filter + Sort */}
            <div
              className={
                currentUserPremiumType !== 0 && premiumStatusLoaded
                  ? "flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-4"
                  : "flex w-full flex-col gap-4"
              }
            >
              {/* Search input - takes 50% width for premium users */}
              <div
                className={`relative ${
                  currentUserPremiumType !== 0 && premiumStatusLoaded
                    ? "w-full lg:w-1/2"
                    : "w-full"
                }`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${filterSort === "name-all-items" ? "items" : filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ").toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`text-primary-text border-border-primary hover:border-border-focus bg-secondary-bg placeholder-secondary-text w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none ${
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

              {/* Filter and Sort dropdowns container - responsive layout for premium users */}
              <div
                className={`flex ${
                  currentUserPremiumType !== 0 && premiumStatusLoaded
                    ? "w-full flex-col gap-4 lg:w-1/2 lg:flex-row"
                    : "w-full flex-col gap-4"
                }`}
              >
                {/* Filter dropdown */}
                <div
                  className={`${
                    currentUserPremiumType !== 0 && premiumStatusLoaded
                      ? "w-full lg:w-1/2"
                      : "w-full"
                  }`}
                >
                  {selectLoaded ? (
                    <Select
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
                        const newValue = (option as { value: FilterSort })
                          .value;
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
                <div
                  className={`${
                    currentUserPremiumType !== 0 && premiumStatusLoaded
                      ? "w-full lg:w-1/2"
                      : "w-full"
                  }`}
                >
                  {selectLoaded ? (
                    <Select
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

            {/* Value range slider (always its own row) */}
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
          {/* Right: Ad */}
          {premiumStatusLoaded && currentUserPremiumType === 0 && (
            <div className="flex w-full max-w-[480px] flex-col lg:w-[480px] lg:flex-shrink-0">
              <span className="text-secondary-text mb-2 block text-center text-xs">
                ADVERTISEMENT
              </span>
              <div className="responsive-ad-container-search">
                <DisplayAd
                  adSlot="8162235433"
                  adFormat="auto"
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
              </div>
              <AdRemovalNotice className="mt-2" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
