"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import { trackEvent } from "@/utils/analytics/rybbit";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";
import { MaxStreamsError, searchDupeOwners } from "@/utils/api/api";
import { useUsernameToId } from "@/hooks/useUsernameToId";
import { DefaultAvatar } from "@/utils/ui/avatar";
import type { DupeOwnerSearchResult } from "@/types";

interface DupeSearchInputProps {
  initialValue?: string;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const MIN_QUERY_LENGTH = 1;
const SUGGESTIONS_LIMIT = 8;
const SUGGESTIONS_DEBOUNCE_MS = 300;

export default function DupeSearchInput({
  initialValue = "",
  isLoading = false,
  placeholder = "Enter Roblox ID or username...",
  className = "",
}: DupeSearchInputProps) {
  const [searchId, setSearchId] = useState(initialValue);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserEditRef = useRef(false);

  useEffect(() => {
    isUserEditRef.current = false;
    setSearchId(initialValue);
  }, [initialValue]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const router = useRouter();
  const { getId: getRobloxId } = useUsernameToId();

  const [suggestions, setSuggestions] = useState<DupeOwnerSearchResult[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());
  const fetchTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const cancelPendingSuggestionsFetch = useCallback(() => {
    if (fetchTimeoutIdRef.current) {
      clearTimeout(fetchTimeoutIdRef.current);
      fetchTimeoutIdRef.current = null;
    }
    activeAbortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const query = searchId.trim();
    cancelPendingSuggestionsFetch();

    if (!isUserEditRef.current || query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      setIsSuggestionsOpen(false);
      return;
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;

    setIsSuggestionsLoading(true);
    setIsSuggestionsOpen(true);

    fetchTimeoutIdRef.current = setTimeout(async () => {
      try {
        const results = await searchDupeOwners(
          query,
          SUGGESTIONS_LIMIT,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          latestRequestIdRef.current !== requestId
        )
          return;
        setSuggestions(results);
        setHighlightedIndex(-1);
      } catch {
        if (
          controller.signal.aborted ||
          latestRequestIdRef.current !== requestId
        )
          return;
        setSuggestions([]);
      } finally {
        if (
          !controller.signal.aborted &&
          latestRequestIdRef.current === requestId
        ) {
          setIsSuggestionsLoading(false);
        }
      }
    }, SUGGESTIONS_DEBOUNCE_MS);
  }, [searchId, cancelPendingSuggestionsFetch]);

  useEffect(() => {
    return () => {
      cancelPendingSuggestionsFetch();
    };
  }, [cancelPendingSuggestionsFetch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToOwner = (owner: DupeOwnerSearchResult) => {
    trackEvent("Dupe Search Suggestion Select", {
      searchTerm: searchId.trim(),
      selectedId: owner.id,
    });
    cancelPendingSuggestionsFetch();
    isUserEditRef.current = false;
    setSuggestions([]);
    setIsSuggestionsOpen(false);
    setSearchId(owner.name);
    setIsSearching(true);
    router.push(`/dupes/${owner.id}`);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = searchId.trim();
    if (!input) return;

    setIsSuggestionsOpen(false);
    trackEvent("Dupe Search", { searchTerm: input });
    setSearchError(null);

    const isUsername = !/^\d+$/.test(input);
    if (!isUsername) {
      setIsSearching(true);
      router.push(`/dupes/${input}`);
      return;
    }

    setIsSearching(true);
    try {
      const resolvedId = await getRobloxId(input);
      if (resolvedId) {
        router.push(`/dupes/${input}`);
      } else {
        setIsSearching(false);
        const truncated =
          input.length > 50 ? `${input.substring(0, 47)}...` : input;
        const msg = `Username "${truncated}" not found. Please check the spelling and try again.`;
        toast.error(msg);
        setSearchError(msg);
      }
    } catch (err) {
      setIsSearching(false);
      const msg =
        err instanceof MaxStreamsError
          ? "Unable to search by username at this time. Please use the Roblox ID instead."
          : "Server error while looking up username. Please try searching by Roblox ID instead.";
      toast.error(msg);
      setSearchError(msg);
    }
  };

  // Use internal loading state or external loading state
  const isCurrentlyLoading = isLoading || isSearching;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        goToOwner(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsSuggestionsOpen(false);
    }
  };

  const showDropdown =
    isSuggestionsOpen && searchId.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div className={className} ref={containerRef}>
      <form onSubmit={handleSearch} autoComplete="off">
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            id="searchId"
            value={searchId}
            onChange={(e) => {
              isUserEditRef.current = true;
              setSearchId(e.target.value);
            }}
            onKeyDown={handleInputKeyDown}
            onFocus={() => {
              if (
                isUserEditRef.current &&
                searchId.trim().length >= MIN_QUERY_LENGTH
              ) {
                setIsSuggestionsOpen(true);
              }
            }}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="dupe-owner-suggestions"
            aria-autocomplete="list"
            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-3 pr-16 transition-all duration-300 focus:outline-none"
            disabled={isCurrentlyLoading}
            required
          />

          {/* Right side controls container */}
          <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
            {/* Clear button - only show when there's text */}
            {searchId && (
              <button
                type="button"
                onClick={() => {
                  setSearchId("");
                  searchInputRef.current?.focus();
                }}
                className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" className="h-5 w-5" />
              </button>
            )}

            {/* Vertical divider - only show when there's text to clear */}
            {searchId && (
              <div className="border-primary-text h-6 border-l opacity-30"></div>
            )}

            {/* Search button */}
            <button
              type="submit"
              disabled={isCurrentlyLoading || !searchId.trim()}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 ${
                isCurrentlyLoading
                  ? "text-secondary-text cursor-progress"
                  : !searchId.trim()
                    ? "text-secondary-text cursor-not-allowed opacity-50"
                    : "hover:bg-link/10 text-link cursor-pointer"
              }`}
              aria-label="Search"
            >
              {isCurrentlyLoading ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <Icon icon="heroicons:magnifying-glass" className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Autocomplete suggestions dropdown */}
          {showDropdown && (
            <ul
              id="dupe-owner-suggestions"
              role="listbox"
              className="border-border-card bg-secondary-bg absolute top-full left-0 z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border shadow-lg"
            >
              {isSuggestionsLoading ? (
                <li className="text-secondary-text flex items-center gap-2 px-4 py-3 text-sm">
                  <Spinner className="h-4 w-4" />
                  Searching...
                </li>
              ) : suggestions.length === 0 ? (
                <li className="text-secondary-text px-4 py-3 text-sm">
                  No matching duped users found
                </li>
              ) : (
                suggestions.map((owner, index) => (
                  <li
                    key={owner.id}
                    role="option"
                    aria-selected={index === highlightedIndex}
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToOwner(owner)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        index === highlightedIndex
                          ? "bg-tertiary-bg"
                          : "hover:bg-tertiary-bg"
                      }`}
                    >
                      <div className="bg-quaternary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                        {!avatarErrors.has(owner.id) ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${owner.id}/avatar-headshot`}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            onError={() =>
                              setAvatarErrors((prev) =>
                                new Set(prev).add(owner.id),
                              )
                            }
                          />
                        ) : (
                          <DefaultAvatar name={owner.name} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-primary-text truncate text-sm font-medium">
                          {owner.displayName}
                        </p>
                        <p className="text-secondary-text truncate text-xs">
                          @{owner.name}
                        </p>
                      </div>
                      <span className="text-secondary-text shrink-0 text-xs">
                        {owner.total_dupes}{" "}
                        {owner.total_dupes === "1" ? "dupe" : "dupes"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </form>
      {searchError && (
        <div className="text-primary-text border-button-danger/30 bg-button-danger/10 mt-2 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
          <Icon
            icon="heroicons:exclamation-circle"
            className="h-4 w-4 shrink-0"
          />
          {searchError}
        </div>
      )}
    </div>
  );
}
