"use client";

import {
  Fragment,
  type FormEventHandler,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSortLabel, type SortGroup } from "@/utils/api/sortGroups";
import { Icon } from "@/components/ui/IconWrapper";
import { UpdatePill } from "@/components/ui/UpdatePill";
import { SuggestionFilterBar } from "@/components/Items/Suggestions/SuggestionFilterBar";

interface SuggestionsToolbarProps {
  actions: ReactNode;
  loadingSuggestions: boolean;
  total: number;
  urlQuery: string;
  sortGroups: SortGroup[];
  sort: string | null;
  canSeeVt: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  isSearchLoading: boolean;
  hasSearchText: boolean;
  isSearchHighlighted: boolean;
  onSearchSubmit: FormEventHandler<HTMLFormElement>;
  onSearchTextChange: (value: string) => void;
  onClearSearch: () => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  fieldFilter: string[];
  onFieldFilterChange: (value: string) => void;
  suggestionFields: string[];
  pendingNew: number;
  pendingTypes: Set<string>;
  onSortChange: (value: string) => void;
  onRefresh: () => void;
}

export function SuggestionsToolbar({
  actions,
  loadingSuggestions,
  total,
  urlQuery,
  sortGroups,
  sort,
  canSeeVt,
  searchInputRef,
  isSearchLoading,
  hasSearchText,
  isSearchHighlighted,
  onSearchSubmit,
  onSearchTextChange,
  onClearSearch,
  typeFilter,
  onTypeFilterChange: handleTypeFilterChange,
  fieldFilter,
  onFieldFilterChange: handleFieldFilterChange,
  suggestionFields,
  pendingNew,
  pendingTypes,
  onSortChange: handleSortChange,
  onRefresh,
}: SuggestionsToolbarProps) {
  const visibleSortGroups = sortGroups
    .map((group) => ({
      ...group,
      options: group.options.filter(
        (option) => option.value !== "value_team" || canSeeVt,
      ),
    }))
    .filter((group) => group.options.length > 0);

  const sortControl = visibleSortGroups.length > 0 && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Sort suggestions"
          className="border-border-card bg-secondary-bg text-primary-text hover:border-border-focus focus:ring-button-info/50 flex h-14 w-full items-center gap-2 rounded-lg border px-4 text-sm transition-colors focus:ring-1 focus:outline-none"
        >
          <span className="text-secondary-text">Sort:</span>
          <span className="min-w-0 flex-1 truncate text-left font-medium">
            {getSortLabel(sortGroups, sort)}
          </span>
          <Icon
            icon="heroicons:chevron-down"
            className="text-secondary-text h-4 w-4 shrink-0"
            inline
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-border-card bg-secondary-bg text-primary-text w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width) rounded-xl border p-1 shadow-lg"
      >
        <DropdownMenuRadioGroup
          value={sort ?? ""}
          onValueChange={handleSortChange}
        >
          {visibleSortGroups.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 && <DropdownMenuSeparator />}
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
            </Fragment>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Title row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-primary-text font-semibold">
          {loadingSuggestions
            ? "Loading suggestions…"
            : `${total} ${urlQuery ? (total === 1 ? "Search Result" : "Search Results") : "Recent Suggestions"}`}
        </h2>
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      </div>

      {/* Search + filter */}
      <SuggestionFilterBar
        searchInputRef={searchInputRef}
        urlQuery={urlQuery}
        isSearchLoading={isSearchLoading}
        hasSearchText={hasSearchText}
        isSearchHighlighted={isSearchHighlighted}
        onSearchSubmit={onSearchSubmit}
        onSearchTextChange={onSearchTextChange}
        onClearSearch={onClearSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        fieldFilter={fieldFilter}
        onFieldFilterChange={handleFieldFilterChange}
        suggestionFields={suggestionFields}
        sortControl={sortControl}
      />

      {(pendingNew > 0 || pendingTypes.size > 0) && !loadingSuggestions && (
        <UpdatePill onClick={onRefresh}>
          {(() => {
            const hasNew = pendingNew > 0;
            const hasOther = pendingTypes.size > 0;

            if (hasNew && !hasOther) {
              return (
                <>
                  <Icon
                    icon="material-symbols:arrow-upward-rounded"
                    className="h-4 w-4"
                    inline
                  />
                  {pendingNew === 1
                    ? "1 new suggestion"
                    : `${pendingNew} new suggestions`}{" "}
                  — click to load
                </>
              );
            }

            let label: string;
            if (hasNew && hasOther) {
              label = "New suggestions & updates — click to refresh";
            } else if (pendingTypes.has("vote") || pendingTypes.has("unvote")) {
              label =
                pendingTypes.size === 1
                  ? "Vote counts updated — click to refresh"
                  : "Suggestions updated — click to refresh";
            } else if (pendingTypes.has("status")) {
              label =
                pendingTypes.size === 1
                  ? "A suggestion status changed — click to refresh"
                  : "Suggestions updated — click to refresh";
            } else if (pendingTypes.has("edit")) {
              label =
                pendingTypes.size === 1
                  ? "A suggestion was edited — click to refresh"
                  : "Suggestions updated — click to refresh";
            } else {
              label = "Suggestions updated — click to refresh";
            }

            return (
              <>
                <Icon
                  icon="material-symbols:refresh-rounded"
                  className="h-4 w-4"
                  inline
                />
                {label}
              </>
            );
          })()}
        </UpdatePill>
      )}
    </>
  );
}
