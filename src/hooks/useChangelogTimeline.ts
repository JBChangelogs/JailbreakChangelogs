import { useQuery } from "@tanstack/react-query";
import { Changelog, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export class ChangelogRateLimitError extends Error {
  constructor(readonly retryAfter: number | null) {
    super("Changelog rate limit reached");
  }
}

export function useChangelogTimeline() {
  return useQuery({
    queryKey: ["changelog-timeline"],
    queryFn: async ({ signal }): Promise<Changelog[]> => {
      if (!PUBLIC_API_URL) throw new Error("Missing PUBLIC_API_URL");
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        "/v2/changelogs",
      );
      const response = await fetch(url, {
        credentials: "include",
        signal,
        headers: {
          ...headers,
          "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
        },
      });
      if (response.status === 429) {
        const raw = response.headers.get("retry-after");
        throw new ChangelogRateLimitError(
          raw ? Number.parseInt(raw, 10) : null,
        );
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch changelog list (${response.status})`);
      }
      const data = (await response.json()) as Changelog[];
      return [...data].sort((a, b) => b.id - a.id);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
