"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";
import { parseSortGroups, type SortGroup } from "@/utils/api/sortGroups";

type SetSort = (value: string, history?: "replace") => void;

export function useSuggestionSort(
  initialSort: string | null,
  setSort: SetSort,
) {
  const initialSortRef = useRef(initialSort);
  const availableSortsRef = useRef<string[]>([]);
  const sortGroupsQuery = useQuery({
    queryKey: ["value-suggestion-sorts"],
    queryFn: async ({ signal }): Promise<SortGroup[]> => {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL!,
        "/v2/value-suggestions/sorts",
      );
      const response = await fetch(url, {
        credentials: "include",
        headers,
        signal,
      });
      if (!response.ok)
        throw new Error(`Suggestion sorts request failed (${response.status})`);
      return parseSortGroups(await response.json());
    },
    enabled: Boolean(PUBLIC_API_URL),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const sortGroups = sortGroupsQuery.data ?? EMPTY_SORT_GROUPS;

  useEffect(() => {
    const sorts = sortGroups.flatMap((group) =>
      group.options.map((option) => option.value),
    );
    if (sorts.length === 0) return;
    availableSortsRef.current = sorts;
    if (initialSortRef.current === null) {
      const cachedSort = getCachedPreference("vsuggestions_sort");
      const storedSort = localStorage.getItem("vsuggestions_sort");
      setSort(
        (typeof cachedSort === "string" ? cachedSort : storedSort) ?? sorts[0],
        "replace",
      );
      initialSortRef.current = sorts[0];
    }
  }, [sortGroups, setSort]);

  useEffect(() => {
    const handlePreference = (event: Event) => {
      const { key, value } = (
        event as CustomEvent<{ key: string; value?: unknown }>
      ).detail;
      if (key === "vsuggestions_sort" && typeof value === "string") {
        localStorage.setItem("vsuggestions_sort", value);
        setSort(value);
      }
    };
    const handlePreferences = (event: Event) => {
      const preferences = (event as CustomEvent<Record<string, unknown>>)
        .detail;
      const incoming = preferences?.["vsuggestions_sort"];
      if (typeof incoming === "string") {
        localStorage.setItem("vsuggestions_sort", incoming);
        setSort(incoming);
      } else {
        localStorage.removeItem("vsuggestions_sort");
        const fallback = availableSortsRef.current[0];
        if (fallback) setSort(fallback);
      }
    };
    const handlePreferenceDeleted = (event: Event) => {
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (key !== "vsuggestions_sort") return;
      localStorage.removeItem("vsuggestions_sort");
      const fallback = availableSortsRef.current[0];
      if (fallback) setSort(fallback);
    };
    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    window.addEventListener(
      "realtimePreferenceDeleted",
      handlePreferenceDeleted,
    );
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
      window.removeEventListener(
        "realtimePreferenceDeleted",
        handlePreferenceDeleted,
      );
    };
  }, [setSort]);

  const handleSortChange = (value: string) => {
    localStorage.setItem("vsuggestions_sort", value);
    setSort(value);
    window.dispatchEvent(
      new CustomEvent("sendRealtimePreference", {
        detail: { key: "vsuggestions_sort", value },
      }),
    );
  };

  return { sortGroups, handleSortChange };
}

const EMPTY_SORT_GROUPS: SortGroup[] = [];
