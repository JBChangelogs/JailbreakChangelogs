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
  // The term and whether it may be searched settle together: pairing the
  // settled term with the current flag could send a disabled one, like a
  // bare "@" (every user) the moment a name is typed after it.
  const [debounced, setDebounced] = useState({ term, enabled });
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebounced({ term, enabled }),
      150,
    );
    return () => window.clearTimeout(timeout);
  }, [term, enabled]);
  const search = useQuery({
    // Settings and themes depend on who's signed in.
    queryKey: ["omni-search", debounced.term, limit, userId ?? null],
    queryFn: ({ signal }) => fetchOmniSearch(debounced.term, limit, signal),
    // Both now and when it settled, so leaving a disabled term never sends it.
    enabled: enabled && debounced.enabled && !!debounced.term,
    // The last results stay up while the next ones load.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  return {
    ...search,
    // Still typing, or waiting on this exact text.
    isPending:
      enabled && !!term && (debounced.term !== term || search.isFetching),
  };
}
