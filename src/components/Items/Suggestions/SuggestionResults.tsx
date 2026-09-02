"use client";

import type { ChangeEvent, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { SuggestionCard } from "@/components/Items/Suggestions/SuggestionCard";
import { SuggestionCardSkeletons } from "@/components/Items/Suggestions/SuggestionCardSkeletons";
import type { Suggestion } from "@/components/Items/Suggestions/types";

interface SuggestionResultsProps {
  loadingSuggestions: boolean;
  noSuggestionsFound: boolean;
  suggestionsError: string | null;
  suggestions: Suggestion[];
  filteredSuggestions: Suggestion[];
  isAuthenticated: boolean;
  userId?: string;
  userHasRoblox: boolean;
  isBanned: boolean;
  urlQuery: string;
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
  onOpenEdit: (suggestion: Suggestion, event: MouseEvent) => void;
}

export function SuggestionResults({
  loadingSuggestions,
  noSuggestionsFound,
  suggestionsError,
  suggestions,
  filteredSuggestions,
  isAuthenticated,
  userId,
  userHasRoblox,
  isBanned,
  urlQuery,
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
  onOpenEdit,
}: SuggestionResultsProps) {
  return (
    <>
      {/* Cards */}
      {loadingSuggestions ? (
        <SuggestionCardSkeletons />
      ) : noSuggestionsFound ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <Image
            src="/assets/images/404.svg"
            alt="No suggestions found"
            width={180}
            height={180}
            className="mx-auto mb-4"
          />
          <h3 className="text-primary-text mb-2 text-lg font-semibold">
            No suggestions yet
          </h3>
          <p className="text-secondary-text mb-6 text-sm">
            {!isAuthenticated
              ? "Log in to be the first to submit a item suggestion."
              : !userHasRoblox
                ? "You need to connect your Roblox account before you can submit a suggestion."
                : "Be the first to suggest a value change."}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {!isAuthenticated ? (
              <Button
                onClick={onLogin}
                className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2"
              >
                <Icon
                  icon="material-symbols:login-rounded"
                  className="h-4 w-4"
                  inline
                />
                Log In
              </Button>
            ) : !userHasRoblox ? (
              <Button
                onClick={onConnectRoblox}
                className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2"
              >
                <Icon icon="simple-icons:roblox" className="h-4 w-4" inline />
                Connect Roblox
              </Button>
            ) : (
              <Button
                onClick={onOpenForm}
                disabled={isBanned}
                className="bg-button-info hover:bg-button-info-hover text-form-button-text flex items-center gap-2 disabled:opacity-50"
              >
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
      ) : filteredSuggestions.length === 0 ? (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
          <h3 className="text-primary-text mb-1 font-semibold">
            {suggestions.length === 0
              ? "No suggestions yet"
              : urlQuery
                ? `No suggestions found matching "${urlQuery}"`
                : "No results"}
          </h3>
          <p className="text-secondary-text text-sm">
            {suggestions.length === 0
              ? "Be the first to submit a item suggestion."
              : "Try adjusting your search or filter."}
          </p>
          {suggestions.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button onClick={onClearAllFilters} variant="default">
                Clear All Filters
              </Button>
            </div>
          )}
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
                  canEdit={
                    isAuthenticated &&
                    userId === suggestion.user.id &&
                    suggestion.status === "pending"
                  }
                  onVote={(type, event) => onVote(suggestion, type, event)}
                  onOpenVoters={(tab, event) =>
                    onOpenVoters(suggestion, tab, event)
                  }
                  onOpenEdit={(event) => onOpenEdit(suggestion, event)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loadingSuggestions && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination count={totalPages} page={page} onChange={onPageChange} />
        </div>
      )}
    </>
  );
}
