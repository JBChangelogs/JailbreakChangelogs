"use client";

import { useEffect, useRef, useState } from "react";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { getCachedPreference } from "@/utils/preferences/realtimePreferencesCache";

type SetSort = (value: string, history?: "replace") => void;

export function useSuggestionSort(
  initialSort: string | null,
  setSort: SetSort,
) {
  const initialSortRef = useRef(initialSort);
  const [availableSorts, setAvailableSorts] = useState<string[]>([]);
  const availableSortsRef = useRef<string[]>([]);

  useEffect(() => {
    let ignore = false;

    const { url, headers } = buildApiFetchRequest(
      PUBLIC_API_URL!,
      "/value-suggestions/sorts",
    );
    fetch(url, { credentials: "include", headers })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (ignore) return;
        if (Array.isArray(data) && data.length > 0) {
          const sorts = data as string[];
          availableSortsRef.current = sorts;
          setAvailableSorts(sorts);
          if (initialSortRef.current === null) {
            const cachedSort = getCachedPreference("vsuggestions_sort");
            const storedSort = localStorage.getItem("vsuggestions_sort");
            setSort(
              (typeof cachedSort === "string" ? cachedSort : storedSort) ??
                (data as string[])[0],
              "replace",
            );
          }
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [setSort]);

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

  return { availableSorts, handleSortChange };
}
