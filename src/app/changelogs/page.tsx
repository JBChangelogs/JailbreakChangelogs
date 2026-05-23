"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import RateLimitView from "@/components/Layout/RateLimitView";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function ChangelogsPage() {
  const router = useRouter();
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const redirectToLatest = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }
        const apiBaseUrl = PUBLIC_API_URL;

        const { url: changelogsLatestUrl, headers: changelogsLatestHeaders } =
          buildApiFetchRequest(apiBaseUrl, "/changelogs/latest");
        const response = await fetch(changelogsLatestUrl, {
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
            setIsRateLimited(true);
            setRateLimitRetryAfter(raw ? parseInt(raw, 10) : null);
            return;
          }
          const body = await response.json().catch(() => ({}));
          log.error("fetch latest changelog failed", {
            status: response.status,
            body,
          });
          throw new Error("Failed to fetch latest changelog");
        }

        const latestChangelog = await response.json();
        router.replace(`/changelogs/${latestChangelog.id}`);
      } catch (error) {
        log.error("Error fetching latest changelog", error);
        router.replace("/changelogs/timeline");
      }
    };

    void redirectToLatest();
  }, [router]);

  if (isRateLimited) {
    return <RateLimitView retryAfter={rateLimitRetryAfter} />;
  }

  return null;
}
