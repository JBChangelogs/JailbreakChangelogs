"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import RateLimitView from "@/components/Layout/RateLimitView";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function ChangelogsPage() {
  const router = useRouter();
  const latestQuery = useQuery({
    queryKey: ["latest-changelog-redirect"],
    queryFn: async ({ signal }): Promise<{ id: number }> => {
      if (!PUBLIC_API_URL) {
        throw new Error("Missing PUBLIC_API_URL");
      }
      const { url: changelogsLatestUrl, headers: changelogsLatestHeaders } =
        buildApiFetchRequest(PUBLIC_API_URL, "/v2/changelogs/latest");
      const response = await fetch(changelogsLatestUrl, {
        signal,
        credentials: "include",
        headers: {
          ...changelogsLatestHeaders,
          "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
        },
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 429) {
          const raw = response.headers.get("retry-after");
          throw new ChangelogRateLimitError(raw ? parseInt(raw, 10) : null);
        }
        const body = await response.json().catch(() => ({}));
        log.error("fetch latest changelog failed", {
          status: response.status,
          body,
        });
        throw new Error("Failed to fetch latest changelog");
      }

      return response.json() as Promise<{ id: number }>;
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const latestId = latestQuery.data?.id;
  const error = latestQuery.error;
  useEffect(() => {
    if (latestId) router.replace(`/changelogs/${latestId}`);
    else if (error && !(error instanceof ChangelogRateLimitError)) {
      log.error("Error fetching latest changelog", error);
      router.replace("/changelogs/timeline");
    }
    // router from nextjs-toploader/app returns a new object reference on every
    // render, so including it here would re-trigger the redirect.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [latestId, error]);

  if (!latestId && error instanceof ChangelogRateLimitError) {
    return <RateLimitView retryAfter={error.retryAfter} />;
  }

  return null;
}

class ChangelogRateLimitError extends Error {
  constructor(readonly retryAfter: number | null) {
    super("Latest changelog request was rate limited");
  }
}
