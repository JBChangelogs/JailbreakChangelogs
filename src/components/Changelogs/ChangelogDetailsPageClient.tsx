"use client";

import ChangelogDetailsClient from "@/components/Changelogs/ChangelogDetailsClient";
import { CommentData } from "@/utils/api/api";
import { UserData } from "@/types/auth";
import { notFound } from "next/navigation";
import ChangelogRouteLoading from "@/app/changelogs/[id]/loading";
import RateLimitView from "@/components/Layout/RateLimitView";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import {
  ChangelogRateLimitError,
  useChangelogTimeline,
} from "@/hooks/useChangelogTimeline";

interface ChangelogDetailsPageClientProps {
  changelogId: string;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

export default function ChangelogDetailsPageClient({
  changelogId,
  initialComments = [],
  initialUserMap = {},
}: ChangelogDetailsPageClientProps) {
  const timelineQuery = useChangelogTimeline();
  const changelogList = timelineQuery.data;
  const currentChangelog = changelogList?.find(
    (changelog) => changelog.id.toString() === changelogId,
  );
  const rateLimitError =
    timelineQuery.error instanceof ChangelogRateLimitError
      ? timelineQuery.error
      : null;

  if (rateLimitError && !changelogList) {
    return <RateLimitView retryAfter={rateLimitError.retryAfter} />;
  }

  if (
    (timelineQuery.isError && !changelogList) ||
    (changelogList && !currentChangelog)
  ) {
    notFound();
  }

  if (!changelogList || !currentChangelog) {
    return (
      <>
        <NitroRailAd
          adIdSmall="np-changelog-rail"
          adIdWide="np-changelog-rail-wide"
        />
        <NitroRailAd
          adIdSmall="np-changelog-rail-right"
          adIdWide="np-changelog-rail-right-wide"
          side="right"
        />
        <ChangelogRouteLoading />
      </>
    );
  }

  return (
    <>
      <NitroRailAd
        adIdSmall="np-changelog-rail"
        adIdWide="np-changelog-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-changelog-rail-right"
        adIdWide="np-changelog-rail-right-wide"
        side="right"
      />
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
