"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/utils/api/api";
import type { UserData } from "@/types/auth";

interface UseUserSearchOptions {
  limit?: number;
  enabled?: boolean;
}

export function useUserSearch(
  query: string,
  currentUserId: string | null,
  { limit = 100, enabled = true }: UseUserSearchOptions = {},
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: ["users", "search", debouncedQuery, limit],
    queryFn: async ({ signal }) => {
      const response = await searchUsers(debouncedQuery, limit, signal);
      return (
        Array.isArray(response)
          ? response
          : Array.isArray(response?.users)
            ? response.users
            : []
      ) as UserData[];
    },
    enabled: enabled && !!debouncedQuery && debouncedQuery === query.trim(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const results =
    enabled && query.trim()
      ? (searchQuery.data ?? []).filter(
          (result) => result?.id !== currentUserId,
        )
      : [];
  const isLoading =
    enabled &&
    !!query.trim() &&
    (debouncedQuery !== query.trim() || searchQuery.isPending);

  return { results, isLoading };
}
