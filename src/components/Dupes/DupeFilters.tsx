"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { DupeFinderItem } from "@/types";

const Select = dynamic(() => import("react-select"), { ssr: false });

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
  const [selectLoaded, setSelectLoaded] = useState(false);
  const MAX_SEARCH_LENGTH = 50;

  // Load Select component
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Get available categories
  const availableCategories = Array.from(
    new Set(initialData.map((item) => item.categoryTitle)),
  ).sort();

  const sortOptions = [
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
    ...(hasDuplicates
      ? [{ value: "duplicates", label: "Group Duplicates" }]
      : []),
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
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
      <h2 className="text-muted mb-4 text-xl font-semibold">Filter & Sort</h2>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        {/* Search Bar */}
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={MAX_SEARCH_LENGTH}
            className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2 pr-10 pl-10 placeholder-[#D3D9D4] shadow-sm focus:border-[#5865F2] focus:outline-none"
          />
          <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
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
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#37424D",
                  borderColor: "#2E3944",
                  color: "#D3D9D4",
                }),
                singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#37424D",
                  color: "#D3D9D4",
                  zIndex: 3000,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "#5865F2"
                    : state.isFocused
                      ? "#2E3944"
                      : "#37424D",
                  color:
                    state.isSelected || state.isFocused ? "#FFFFFF" : "#D3D9D4",
                  "&:active": {
                    backgroundColor: "#124E66",
                    color: "#FFFFFF",
                  },
                }),
                clearIndicator: (base) => ({
                  ...base,
                  color: "#D3D9D4",
                  "&:hover": {
                    color: "#FFFFFF",
                  },
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: "#D3D9D4",
                  "&:hover": {
                    color: "#FFFFFF",
                  },
                }),
                placeholder: (base) => ({ ...base, color: "#D3D9D4" }),
                input: (base) => ({ ...base, color: "#D3D9D4" }),
              }}
            />
          ) : (
            <div className="h-10 w-full rounded-lg border border-[#2E3944] bg-[#37424D]"></div>
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
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#37424D",
                  borderColor: "#2E3944",
                  color: "#D3D9D4",
                }),
                singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#37424D",
                  color: "#D3D9D4",
                  zIndex: 3000,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "#5865F2"
                    : state.isFocused
                      ? "#2E3944"
                      : "#37424D",
                  color:
                    state.isSelected || state.isFocused ? "#FFFFFF" : "#D3D9D4",
                  "&:active": {
                    backgroundColor: "#124E66",
                    color: "#FFFFFF",
                  },
                }),
                clearIndicator: (base) => ({
                  ...base,
                  color: "#D3D9D4",
                  "&:hover": {
                    color: "#FFFFFF",
                  },
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  color: "#D3D9D4",
                  "&:hover": {
                    color: "#FFFFFF",
                  },
                }),
                placeholder: (base) => ({ ...base, color: "#D3D9D4" }),
                input: (base) => ({ ...base, color: "#D3D9D4" }),
              }}
              isSearchable={false}
            />
          ) : (
            <div className="h-10 w-full rounded-lg border border-[#2E3944] bg-[#37424D]"></div>
          )}
        </div>
      </div>
    </div>
  );
}
