"use client";

import { useEffect, useRef, useState } from "react";
import { createLogger } from "@/services/logger";
import { searchUsers } from "@/utils/api/api";
import type { UserData } from "@/types/auth";

const log = createLogger("UI");

interface UseUserSearchOptions {
  limit?: number;
  enabled?: boolean;
}

export function useUserSearch(
  query: string,
  currentUserId: string | null,
  { limit = 100, enabled = true }: UseUserSearchOptions = {},
) {
  const [results, setResults] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!enabled || !trimmedQuery) {
      requestIdRef.current += 1;
      setResults([]);
      setIsLoading(false);
      return;
    }

    const requestId = (requestIdRef.current += 1);
    setIsLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const resultsRaw = await searchUsers(trimmedQuery, limit);
        if (requestIdRef.current !== requestId) return;

        const found = Array.isArray(resultsRaw) ? resultsRaw : [];
        setResults(
          currentUserId
            ? found.filter((result) => result?.id !== currentUserId)
            : found,
        );
      } catch (error) {
        if (requestIdRef.current !== requestId) return;
        log.error("Error searching users:", error);
        setResults([]);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentUserId, enabled, limit, query]);

  return { results, isLoading };
}
