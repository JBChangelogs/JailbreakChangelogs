"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  user_id: string;
  logged_at: number;
  history?: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGSearchData {
  results: OGItem[];
  count: number;
  search_id: string;
  search_time: number;
}

interface OGFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  initialData: OGSearchData | null;
}

export default function OGFilters({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  sortOrder,
  setSortOrder,
  initialData,
}: OGFiltersProps) {
  const [selectLoaded, setSelectLoaded] = useState(false);
  const MAX_SEARCH_LENGTH = 50;

  // Load Select component
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Get available categories
  const availableCategories = initialData?.results
    ? Array.from(
        new Set(initialData.results.map((item) => item.categoryTitle)),
      ).sort()
    : [];

  // Check if there are any duplicates in the data
  const hasDuplicates = initialData?.results
    ? (() => {
        const itemCounts = new Map<string, number>();
        initialData.results.forEach((item) => {
          const key = `${item.categoryTitle}-${item.title}`;
          itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
        });
        return Array.from(itemCounts.values()).some((count) => count > 1);
      })()
    : false;

  const sortOptions = [
    ...(hasDuplicates
      ? [{ value: "duplicates", label: "Group Duplicates" }]
      : []),
    {
      label: "Date",
      options: [
        {
          value: "created-desc",
          label: "Logged On (Newest to Oldest)",
        },
        {
          value: "created-asc",
          label: "Logged On (Oldest to Newest)",
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
      label: "Activity",
      options: [
        {
          value: "traded-desc",
          label: "Monthly Traded (High to Low)",
        },
        {
          value: "unique-desc",
          label: "Monthly Unique (High to Low)",
        },
      ],
    },
  ];

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
            className="text-primary-text border-border-primary bg-primary-bg placeholder-secondary-text focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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

        {/* Category Filter */}
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
              placeholder="Filter by category..."
              unstyled
              classNames={{
                control: () =>
                  "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary bg-primary-bg p-3 min-h-[56px] hover:cursor-pointer focus-within:border-button-info",
                singleValue: () => "text-secondary-text",
                placeholder: () => "text-secondary-text",
                menu: () =>
                  "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary bg-secondary-bg shadow-lg",
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
            />
          ) : (
            <div className="border-border-primary bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="w-full sm:w-1/3">
          {selectLoaded ? (
            <Select
              value={{
                value: sortOrder,
                label: (() => {
                  switch (sortOrder) {
                    case "duplicates":
                      return "Group Duplicates";
                    case "alpha-asc":
                      return "Name (A to Z)";
                    case "alpha-desc":
                      return "Name (Z to A)";
                    case "traded-desc":
                      return "Monthly Traded (High to Low)";
                    case "unique-desc":
                      return "Monthly Unique (High to Low)";
                    case "created-asc":
                      return "Logged On (Oldest to Newest)";
                    case "created-desc":
                      return "Logged On (Newest to Oldest)";
                    default:
                      return "Random Order";
                  }
                })(),
              }}
              onChange={(option) => {
                if (!option) {
                  setSortOrder("created-desc");
                  return;
                }
                setSortOrder(
                  (
                    option as {
                      value:
                        | "alpha-asc"
                        | "alpha-desc"
                        | "traded-desc"
                        | "unique-desc"
                        | "created-asc"
                        | "created-desc"
                        | "duplicates";
                    }
                  ).value,
                );
              }}
              options={sortOptions}
              classNamePrefix="react-select"
              className="w-full"
              isMulti={false}
              isClearable={true}
              placeholder="Sort by..."
              unstyled
              classNames={{
                control: () =>
                  "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary bg-primary-bg p-3 min-h-[56px] hover:cursor-pointer focus-within:border-button-info",
                singleValue: () => "text-secondary-text",
                placeholder: () => "text-secondary-text",
                menu: () =>
                  "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary bg-secondary-bg shadow-lg",
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
            <div className="border-border-primary bg-secondary-bg h-10 w-full animate-pulse rounded-md border"></div>
          )}
        </div>
      </div>
    </div>
  );
}
