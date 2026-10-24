"use client";

import { useQuery } from "@tanstack/react-query";
import { PUBLIC_API_URL, type Season } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export class SeasonListRateLimitError extends Error {
  constructor(readonly retryAfter: number | null) {
    super("Season list request was rate limited");
  }
}

export function useSeasonsList() {
  return useQuery({
    queryKey: ["seasons-list"],
    queryFn: async ({ signal }): Promise<Season[]> => {
      if (!PUBLIC_API_URL) throw new Error("Missing PUBLIC_API_URL");
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/v2/seasons",
      );
      const response = await fetch(url, {
        credentials: "include",
        signal,
        headers: {
          ...headers,
          "User-Agent": "JailbreakChangelogs-Seasons/1.0",
        },
      });
      if (response.status === 429) {
        const raw = response.headers.get("retry-after");
        throw new SeasonListRateLimitError(
          raw ? Number.parseInt(raw, 10) : null,
        );
      }
      if (!response.ok) throw new Error("Failed to fetch season list");
      return response.json() as Promise<Season[]>;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
}
