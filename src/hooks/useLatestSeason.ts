import { useQuery } from "@tanstack/react-query";
import { Season } from "@/types/seasons";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export class SeasonRateLimitError extends Error {
  constructor(public readonly retryAfter: number | null) {
    super("Latest season request was rate limited");
  }
}

export function useLatestSeason(enabled = true) {
  return useQuery({
    queryKey: ["latest-season"],
    enabled,
    queryFn: async ({ signal }): Promise<Season> => {
      if (!PUBLIC_API_URL) throw new Error("Missing PUBLIC_API_URL");

      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/v2/seasons/latest",
      );
      const response = await fetch(url, {
        signal,
        credentials: "include",
        headers: {
          ...headers,
          "User-Agent": "JailbreakChangelogs-Seasons/1.0",
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        throw new SeasonRateLimitError(
          retryAfter ? Number.parseInt(retryAfter, 10) : null,
        );
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch latest season (${response.status})`);
      }
      return (await response.json()) as Season;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
}
