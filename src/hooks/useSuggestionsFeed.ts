"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type FeedData = SuggestionsResponse & { noSuggestionsFound: boolean };

function feedKey(urlQuery: string, sort: string | null, page: number) {
  return ["value-suggestions-feed", urlQuery.trim(), sort, page] as const;
}

async function loadFeed(
  urlQuery: string,
  sort: string | null,
  page: number,
  signal: AbortSignal,
): Promise<FeedData> {
  const query = new URLSearchParams({ page: String(page) });
  if (sort !== null) query.set("sort", sort);
  const isSearching = urlQuery.trim().length > 0;
  if (isSearching) query.set("query", urlQuery.trim());
  const endpoint = isSearching
    ? `/v2/value-suggestions/search?${query}`
    : `/v2/value-suggestions?${query}`;
  const { url, headers } = buildApiFetchRequest(PUBLIC_API_URL!, endpoint);
  const response = await fetch(url, {
    credentials: "include",
    headers,
    signal,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 404 && body?.error === "no_suggestions_found") {
      return {
        items: [],
        page,
        size: 0,
        total_pages: 1,
        total: 0,
        noSuggestionsFound: !isSearching,
      };
    }
    log.error("fetch suggestions failed", { status: response.status, body });
    throw new Error("Failed to fetch suggestions");
  }
  const data = (await response.json()) as SuggestionsResponse;
  return { ...data, noSuggestionsFound: false };
}

export function useSuggestionsFeed({
  urlQuery,
  sort,
  page,
}: UseSuggestionsFeedOptions) {
  const queryClient = useQueryClient();
  const [pageChanging, setPageChanging] = useState(false);
  const [pendingNew, setPendingNew] = useState(0);
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);
  const key = useMemo(
    () => feedKey(urlQuery, sort, page),
    [urlQuery, sort, page],
  );
  const feedQuery = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadFeed(urlQuery, sort, page, signal),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (feedQuery.isPending) return;
    hasLoadedOnceRef.current = true;
    setPageChanging(false);
  }, [feedQuery.isPending, feedQuery.dataUpdatedAt, urlQuery, sort, page]);

  const setSuggestions = useCallback<
    React.Dispatch<React.SetStateAction<Suggestion[]>>
  >(
    (update) => {
      queryClient.setQueryData<FeedData>(key, (previous) => {
        const current = previous ?? {
          items: [],
          page,
          size: 0,
          total_pages: 1,
          total: 0,
          noSuggestionsFound: false,
        };
        const items =
          typeof update === "function" ? update(current.items ?? []) : update;
        return { ...current, items };
      });
    },
    [queryClient, key, page],
  );

  const fetchSuggestions = useCallback(
    async (requestedPage: number) => {
      setPendingNew(0);
      setPendingTypes(new Set());
      await queryClient.invalidateQueries({
        queryKey: ["value-suggestions-feed"],
        refetchType: "none",
      });
      try {
        await queryClient.fetchQuery({
          queryKey: feedKey(urlQuery, sort, requestedPage),
          queryFn: ({ signal }) =>
            loadFeed(urlQuery, sort, requestedPage, signal),
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          retry: false,
        });
      } catch {
        // The active query exposes the error to the results UI.
      }
    },
    [queryClient, sort, urlQuery],
  );

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
    suggestions: feedQuery.data?.items ?? [],
    setSuggestions,
    totalPages: feedQuery.data?.total_pages ?? 1,
    total: feedQuery.data?.total ?? 0,
    loadingSuggestions: feedQuery.isPending,
    isSearchLoading: hasLoadedOnceRef.current && feedQuery.isPending,
    pageChanging,
    suggestionsError: feedQuery.data
      ? null
      : (feedQuery.error?.message ?? null),
    noSuggestionsFound: feedQuery.data?.noSuggestionsFound ?? false,
    pendingNew,
    pendingTypes,
    fetchSuggestions,
    beginPageChange: () => setPageChanging(true),
  };
}
