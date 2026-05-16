"use client";

import { createLogger } from "@/services/logger";
import { useEffect, useState } from "react";

const log = createLogger("UI");
import ChangelogDetailsClient from "@/components/Changelogs/ChangelogDetailsClient";
import NitroChangelogRailAd from "@/components/Ads/NitroChangelogRailAd";
import { Changelog, CommentData, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiUrlWithDevToken } from "@/utils/api/apiDevToken";
import { UserData } from "@/types/auth";
import { notFound } from "next/navigation";
import ChangelogRouteLoading from "@/app/changelogs/[id]/loading";
import RateLimitView from "@/components/Layout/RateLimitView";

interface ChangelogDetailsPageClientProps {
  changelogId: string;
  initialComments: CommentData[];
  initialUserMap: Record<string, UserData>;
}

export default function ChangelogDetailsPageClient({
  changelogId,
  initialComments,
  initialUserMap,
}: ChangelogDetailsPageClientProps) {
  const [changelogList, setChangelogList] = useState<Changelog[] | null>(null);
  const [currentChangelog, setCurrentChangelog] = useState<Changelog | null>(
    null,
  );
  const [isNotFound, setIsNotFound] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const loadPageData = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }
        const apiBaseUrl = PUBLIC_API_URL;

        const listResponse = await fetch(
          buildApiUrlWithDevToken(apiBaseUrl, "/changelogs"),
          {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
            },
          },
        );

        if (!listResponse.ok) {
          if (listResponse.status === 429) {
            const raw = listResponse.headers.get("retry-after");
            setIsRateLimited(true);
            setRateLimitRetryAfter(raw ? parseInt(raw, 10) : null);
            return;
          }
          throw new Error("Failed to fetch changelog list");
        }

        const listData = (await listResponse.json()) as Changelog[];
        const sortedChangelogList = [...listData].sort((a, b) => b.id - a.id);

        const matched = sortedChangelogList.find(
          (changelog) =>
            changelog.id.toString() === changelogId ||
            changelog.id === parseInt(changelogId, 10),
        );

        if (!matched) {
          setIsNotFound(true);
          return;
        }

        setChangelogList(sortedChangelogList);
        setCurrentChangelog(matched);
      } catch (error) {
        log.error("Error loading changelog page data", error);
        setIsNotFound(true);
      }
    };

    void loadPageData();
  }, [changelogId]);

  if (isRateLimited) {
    return <RateLimitView retryAfter={rateLimitRetryAfter} />;
  }

  if (isNotFound) {
    notFound();
  }

  if (!changelogList || !currentChangelog) {
    return (
      <>
        <NitroChangelogRailAd />
        <ChangelogRouteLoading />
      </>
    );
  }

  return (
    <>
      <NitroChangelogRailAd />
      <ChangelogDetailsClient
        changelogList={changelogList}
        currentChangelog={currentChangelog}
        changelogId={changelogId}
        initialComments={initialComments}
        initialUserMap={initialUserMap}
      />
    </>
  );
}
