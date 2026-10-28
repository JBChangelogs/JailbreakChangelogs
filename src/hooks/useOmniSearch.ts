"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchOmniSearch } from "@/utils/api/omniSearch";

/** The API's search, 150 ms after typing stops (it allows 120 a minute). */
export function useOmniSearch(
  query: string,
  {
    limit,
    enabled,
    userId,
  }: { limit: number; enabled: boolean; userId?: string },
) {
  const term = query.trim();
  const [debounced, setDebounced] = useState(term);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(term), 150);
    return () => window.clearTimeout(timeout);
  }, [term]);
  const search = useQuery({
    // Settings and themes depend on who's signed in.
    queryKey: ["omni-search", debounced, limit, userId ?? null],
    queryFn: ({ signal }) => fetchOmniSearch(debounced, limit, signal),
    enabled: enabled && !!debounced,
    // The last results stay up while the next ones load.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  return {
    ...search,
    // Still typing, or waiting on this exact text.
    isPending: enabled && !!term && (debounced !== term || search.isFetching),
  };
}
