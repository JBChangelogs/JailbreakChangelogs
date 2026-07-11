"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import TimelineClient from "@/components/Timeline/TimelineClient";
import TimelineLoading from "@/app/changelogs/timeline/loading";
import { Changelog, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import RateLimitView from "@/components/Layout/RateLimitView";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");

export default function TimelinePage() {
  const [changelogs, setChangelogs] = useState<Changelog[] | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    const loadTimeline = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }
        const apiBaseUrl = PUBLIC_API_URL;

        const { url: changelogsUrl, headers: changelogsHeaders } =
          buildApiFetchRequest(apiBaseUrl, "/changelogs");
        const response = await fetch(changelogsUrl, {
          credentials: "include",
          headers: {
            ...changelogsHeaders,
            "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
          },
        });
        if (ignore) return;

        if (!response.ok) {
          if (response.status === 429) {
            const raw = response.headers.get("retry-after");
            setIsRateLimited(true);
            setRateLimitRetryAfter(raw ? parseInt(raw, 10) : null);
            return;
          }
          const body = await response.json().catch(() => ({}));
          log.error("fetch changelog list failed", {
            status: response.status,
            body,
          });
          throw new Error("Failed to fetch changelog list");
        }

        const data = (await response.json()) as Changelog[];
        if (ignore) return;
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setChangelogs(sorted);
      } catch (error) {
        if (ignore) return;
        log.error("Error loading changelog timeline", error);
        setChangelogs([]);
      }
    };

    void loadTimeline();

    return () => {
      ignore = true;
    };
  }, []);

  if (isRateLimited) {
    return <RateLimitView retryAfter={rateLimitRetryAfter} />;
  }

  if (!changelogs) {
    return <TimelineLoading />;
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto">
        <Breadcrumb />
        <TimelineClient changelogs={changelogs} />
      </div>
    </main>
  );
}
