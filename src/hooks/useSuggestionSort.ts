"use client";

import { useEffect, useRef, useState } from "react";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { PUBLIC_API_URL } from "@/utils/api/api";

type SetSort = (value: string, history?: "replace") => void;

export function useSuggestionSort(
  initialSort: string | null,
  setSort: SetSort,
) {
  const initialSortRef = useRef(initialSort);
  const [availableSorts, setAvailableSorts] = useState<string[]>([]);

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
          setAvailableSorts(data as string[]);
          if (initialSortRef.current === null) {
            const storedSort = localStorage.getItem("vsuggestions_sort");
            setSort(storedSort ?? (data as string[])[0], "replace");
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
      }
    };
    window.addEventListener("realtimePreference", handlePreference);
    window.addEventListener("realtimePreferences", handlePreferences);
    return () => {
      window.removeEventListener("realtimePreference", handlePreference);
      window.removeEventListener("realtimePreferences", handlePreferences);
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
