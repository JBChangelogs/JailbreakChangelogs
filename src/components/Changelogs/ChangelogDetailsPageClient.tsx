"use client";

import { useEffect, useState } from "react";
import ChangelogDetailsClient from "@/components/Changelogs/ChangelogDetailsClient";
import NitroChangelogRailAd from "@/components/Ads/NitroChangelogRailAd";
import { Changelog, CommentData, PUBLIC_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import { UserData } from "@/types/auth";
import { notFound } from "next/navigation";
import ChangelogRouteLoading from "@/app/changelogs/[id]/loading";

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

  useEffect(() => {
    const loadPageData = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }

        const listResponse = await fetch(
          buildApiUrlWithDevToken(PUBLIC_API_URL, "/changelogs"),
          {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
            },
          },
        );

        if (!listResponse.ok) {
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
        console.error("Error loading changelog page data:", error);
        setIsNotFound(true);
      }
    };

    void loadPageData();
  }, [changelogId]);

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
