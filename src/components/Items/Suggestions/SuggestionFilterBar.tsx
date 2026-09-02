"use client";

import type { FormEventHandler, RefObject } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { fieldLabel } from "@/components/Items/Suggestions/shared";

interface SuggestionFilterBarProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  urlQuery: string;
  isSearchLoading: boolean;
  hasSearchText: boolean;
  isSearchHighlighted: boolean;
  onSearchSubmit: FormEventHandler<HTMLFormElement>;
  onSearchTextChange: (value: string) => void;
  onClearSearch: () => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  suggestionItemTypes: string[];
  fieldFilter: string;
  onFieldFilterChange: (value: string) => void;
  suggestionFields: string[];
}

export function SuggestionFilterBar({
  searchInputRef,
  urlQuery,
  isSearchLoading,
  hasSearchText,
  isSearchHighlighted,
  onSearchSubmit: handleSearchSubmit,
  onSearchTextChange,
  onClearSearch,
  typeFilter,
  onTypeFilterChange: handleTypeFilterChange,
  suggestionItemTypes,
  fieldFilter,
  onFieldFilterChange: handleFieldFilterChange,
  suggestionFields,
}: SuggestionFilterBarProps) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full sm:flex-1"
        >
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by item name, type, field, or reason..."
            defaultValue={urlQuery}
            disabled={isSearchLoading}
            onInput={(event) => onSearchTextChange(event.currentTarget.value)}
            className={`border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text hover:border-border-focus h-14 w-full rounded-lg border px-4 pr-16 transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
              isSearchHighlighted
                ? "bg-button-info/10 shadow-button-info/20 border-button-info shadow-lg"
                : "focus:border-button-info"
            }`}
          />
          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
            {hasSearchText && (
              <button
                type="button"
                disabled={isSearchLoading}
                onClick={onClearSearch}
                className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5" />
              </button>
            )}
            {hasSearchText && (
              <div className="border-primary-text h-6 border-l opacity-30" />
            )}
            <button
              type="submit"
              disabled={isSearchLoading}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                isSearchLoading
                  ? "text-secondary-text cursor-progress"
                  : hasSearchText
                    ? "hover:bg-link/10 text-link cursor-pointer"
                    : "text-secondary-text cursor-default"
              }`}
              aria-label="Search"
            >
              {isSearchLoading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>

        {/* Item type + field filters — grid so they're side by side on mobile too */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-4">
          <div className="sm:w-48">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                >
                  <span className="truncate">
                    {typeFilter === "All" ? "All Types" : typeFilter}
                  </span>
                  <Icon
                    icon="heroicons:chevron-down"
                    className="text-secondary-text h-5 w-5 shrink-0"
                    inline
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
              >
                <DropdownMenuRadioGroup
                  value={typeFilter}
                  onValueChange={handleTypeFilterChange}
                >
                  <DropdownMenuRadioItem
                    value="All"
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    All Types
                  </DropdownMenuRadioItem>
                  {suggestionItemTypes.map((type) => (
                    <DropdownMenuRadioItem
                      key={type}
                      value={type}
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      {type}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="sm:w-48">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-14 w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                >
                  <span className="truncate">
                    {fieldFilter === "All"
                      ? "All Fields"
                      : fieldLabel(fieldFilter)}
                  </span>
                  <Icon
                    icon="heroicons:chevron-down"
                    className="text-secondary-text h-5 w-5 shrink-0"
                    inline
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="border-border-card bg-secondary-bg text-primary-text max-h-80 w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) scrollbar-thin overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
              >
                <DropdownMenuRadioGroup
                  value={fieldFilter}
                  onValueChange={handleFieldFilterChange}
                >
                  <DropdownMenuRadioItem
                    value="All"
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    All Fields
                  </DropdownMenuRadioItem>
                  {suggestionFields.map((f) => (
                    <DropdownMenuRadioItem
                      key={f}
                      value={f}
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      {fieldLabel(f)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="text-secondary-text mt-2 mb-4 hidden items-center gap-1 text-xs lg:flex">
        <Icon icon="emojione:light-bulb" className="text-sm text-yellow-500" />
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
    </>
  );
}
