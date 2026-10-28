"use client";

import type { ChangeEvent, MouseEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { SuggestionCard } from "@/components/Items/Suggestions/SuggestionCard";
import { SuggestionCardSkeletons } from "@/components/Items/Suggestions/SuggestionCardSkeletons";
import type { Suggestion } from "@/components/Items/Suggestions/types";
import { fieldLabel } from "@/components/Items/Suggestions/shared";

interface SuggestionResultsProps {
  loadingSuggestions: boolean;
  noSuggestionsFound: boolean;
  suggestionsError: string | null;
  filteredSuggestions: Suggestion[];
  isAuthenticated: boolean;
  userId?: string;
  userHasRoblox: boolean;
  isBanned: boolean;
  urlQuery: string;
  activeSortLabel: string | null;
  typeFilter: string;
  fieldFilter: string[];
  hasActiveFilters: boolean;
  totalPages: number;
  page: number;
  pageChanging: boolean;
  votingIds: Set<number>;
  votingTypes: Map<number, "upvote" | "downvote">;
  voteRateLimits: Map<number, number>;
  onLogin: () => void;
  onConnectRoblox: () => void;
  onOpenForm: () => void;
  onRetry: () => void;
  onClearAllFilters: () => void;
  onPageChange: (event: ChangeEvent<unknown>, page: number) => void;
  onVote: (
    suggestion: Suggestion,
    type: "upvote" | "downvote",
    event: MouseEvent,
  ) => void;
  onOpenVoters: (
    suggestion: Suggestion,
    tab: "up" | "down",
    event: MouseEvent,
  ) => void;
  onOpenReport: (suggestion: Suggestion, event: MouseEvent) => void;
}

export function SuggestionResults({
  loadingSuggestions,
  noSuggestionsFound,
  suggestionsError,
  filteredSuggestions,
  isAuthenticated,
  userId,
  userHasRoblox,
  isBanned,
  urlQuery,
  activeSortLabel,
  typeFilter,
  fieldFilter,
  hasActiveFilters,
  totalPages,
  page,
  pageChanging,
  votingIds,
  votingTypes,
  voteRateLimits,
  onLogin,
  onConnectRoblox,
  onOpenForm,
  onRetry,
  onClearAllFilters,
  onPageChange,
  onVote,
  onOpenVoters,
  onOpenReport,
}: SuggestionResultsProps) {
  const fields = new Intl.ListFormat("en", { type: "disjunction" }).format(
    fieldFilter.map(fieldLabel),
  );
  const emptyDescription = `No ${typeFilter === "All" ? "" : `${typeFilter} `}suggestions${fields ? ` for ${fields}` : ""}${urlQuery ? ` matching “${urlQuery}”` : ""}.`;

  return (
    <>
      {/* Cards */}
      {loadingSuggestions ? (
        <SuggestionCardSkeletons />
      ) : suggestionsError ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <h3 className="text-primary-text mb-2 text-lg font-semibold">
            Failed to load suggestions
          </h3>
          <p className="text-secondary-text mb-6 text-sm">
            Something went wrong while fetching suggestions. You can try again
            or return to the values page.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="secondary"
              size="md"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5" />
              Try again
            </Button>
            <Button variant="default" size="md" asChild>
              <Link href="/values">
                <Icon icon="heroicons-outline:arrow-left" className="h-5 w-5" />
                Back to values
              </Link>
            </Button>
          </div>
        </div>
      ) : noSuggestionsFound || filteredSuggestions.length === 0 ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <div
            className="bg-button-info/10 text-button-info mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            aria-hidden="true"
          >
            <Icon icon="heroicons:magnifying-glass" className="h-8 w-8" />
          </div>
          <h3 className="text-primary-text mb-2 text-lg font-semibold">
            {hasActiveFilters
              ? "No matching suggestions"
              : "No suggestions yet"}
          </h3>
          {hasActiveFilters && (
            <p className="text-secondary-text mb-2 text-sm">
              {emptyDescription}
            </p>
          )}
          {activeSortLabel && (
            <p className="text-secondary-text mb-4 text-xs">
              Sorted by {activeSortLabel}.
            </p>
          )}
          <p className="text-secondary-text mb-6 text-sm">
            {hasActiveFilters
              ? "Try different filters or clear them to see more suggestions."
              : !isAuthenticated
                ? "Log in to be the first to submit an item suggestion."
                : !userHasRoblox
                  ? "You need to connect your Roblox account before you can submit a suggestion."
                  : "Be the first to suggest a value change."}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {hasActiveFilters ? (
              <Button onClick={onClearAllFilters} variant="secondary">
                Clear filters
              </Button>
            ) : !isAuthenticated ? (
              <Button onClick={onLogin}>
                <Icon
                  icon="material-symbols:login-rounded"
                  className="h-4 w-4"
                  inline
                />
                Log In
              </Button>
            ) : !userHasRoblox ? (
              <Button onClick={onConnectRoblox}>
                <Icon icon="simple-icons:roblox" className="h-4 w-4" inline />
                Connect Roblox
              </Button>
            ) : (
              <Button onClick={onOpenForm} disabled={isBanned}>
                <Icon
                  icon="material-symbols:add-rounded"
                  className="h-4 w-4"
                  inline
                />
                New Item Suggestion
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {totalPages > 1 && (
            <div className="mb-4 flex justify-center">
              <Pagination
                count={totalPages}
                page={page}
                onChange={onPageChange}
              />
            </div>
          )}
          {pageChanging ? (
            <SuggestionCardSkeletons />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  userId={userId}
                  isVoting={
                    votingIds.has(suggestion.id) ||
                    voteRateLimits.has(suggestion.id) ||
                    isBanned
                  }
                  votingType={votingTypes.get(suggestion.id)}
                  voteRateLimitUntil={voteRateLimits.get(suggestion.id)}
                  onVote={(type, event) => onVote(suggestion, type, event)}
                  onOpenVoters={(tab, event) =>
                    onOpenVoters(suggestion, tab, event)
                  }
                  onOpenReport={(event) => onOpenReport(suggestion, event)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loadingSuggestions &&
        filteredSuggestions.length > 0 &&
        totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={onPageChange}
            />
          </div>
        )}
    </>
  );
}
