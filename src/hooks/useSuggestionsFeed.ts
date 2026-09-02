"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLogger } from "@/services/logger";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import type {
  Suggestion,
  SuggestionsResponse,
} from "@/components/Items/Suggestions/types";

const log = createLogger("API");

interface UseSuggestionsFeedOptions {
  urlQuery: string;
  sort: string | null;
  page: number;
}

export function useSuggestionsFeed({
  urlQuery,
  sort,
  page,
}: UseSuggestionsFeedOptions) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [pageChanging, setPageChanging] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [noSuggestionsFound, setNoSuggestionsFound] = useState(false);
  const [pendingNew, setPendingNew] = useState(0);
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  const fetchSuggestions = useCallback(
    async (requestedPage: number) => {
      setSuggestionsError(null);
      setNoSuggestionsFound(false);
      setPendingNew(0);
      setPendingTypes(new Set());
      const isSearching = urlQuery.trim().length > 0;
      if (hasLoadedOnceRef.current) {
        setIsSearchLoading(true);
      } else {
        setLoadingSuggestions(true);
      }
      try {
        const query = new URLSearchParams({ page: String(requestedPage) });
        if (sort !== null) query.set("sort", sort);
        if (isSearching) query.set("query", urlQuery.trim());
        const endpoint = isSearching
          ? `/value-suggestions/search?${query}`
          : `/value-suggestions/recent?${query}`;
        const { url, headers } = buildApiFetchRequest(
          PUBLIC_API_URL!,
          endpoint,
        );
        const response = await fetch(url, { credentials: "include", headers });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          if (
            response.status === 404 &&
            body?.error === "no_suggestions_found"
          ) {
            if (!isSearching) setNoSuggestionsFound(true);
            setSuggestions([]);
            setTotalPages(1);
            setTotal(0);
            return;
          }
          log.error("fetch suggestions failed", {
            status: response.status,
            body,
          });
          throw new Error("Failed to fetch suggestions");
        }
        const data: SuggestionsResponse = await response.json();
        setSuggestions(data.items ?? []);
        setTotalPages(data.total_pages ?? 1);
        setTotal(data.total ?? 0);
      } catch (error) {
        setSuggestionsError(
          error instanceof Error ? error.message : "Failed to load suggestions",
        );
      } finally {
        hasLoadedOnceRef.current = true;
        setLoadingSuggestions(false);
        setIsSearchLoading(false);
        setPageChanging(false);
      }
    },
    [sort, urlQuery],
  );

  useEffect(() => {
    if (hasLoadedOnceRef.current) {
      setSuggestions([]);
      setLoadingSuggestions(true);
    }
  }, [sort]);

  useEffect(() => {
    void fetchSuggestions(page);
  }, [fetchSuggestions, page]);

  useEffect(() => {
    const handler = (event: Event) => {
      const realtimeEvent = event as CustomEvent<{
        action?: string;
        type?: string;
      }>;
      if (realtimeEvent.detail?.action !== "refresh_suggestions") return;
      const type = realtimeEvent.detail?.type ?? "new";
      if (type === "vote" || type === "unvote") return;
      if (type === "new") {
        setPendingNew((previous) => previous + 1);
      } else {
        setPendingTypes((previous) => new Set([...previous, type]));
      }
    };
    window.addEventListener("realtimeSuggestions", handler);
    return () => window.removeEventListener("realtimeSuggestions", handler);
  }, []);

  return {
    suggestions,
    setSuggestions,
    totalPages,
    total,
    loadingSuggestions,
    isSearchLoading,
    pageChanging,
    suggestionsError,
    noSuggestionsFound,
    pendingNew,
    pendingTypes,
    fetchSuggestions,
    beginPageChange: () => setPageChanging(true),
  };
}
