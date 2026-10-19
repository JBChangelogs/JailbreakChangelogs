"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useRouter } from "nextjs-toploader/app";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonCountdown from "@/components/Seasons/SeasonCountdown";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import SeasonNavigation from "@/components/Seasons/SeasonNavigation";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import {
  hasRewardImage,
  rewardImageUrl,
  sortRewards,
} from "@/components/Seasons/seasonRewards";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatProfileDate } from "@/utils/helpers/timestamp";
import { Season, Reward, CommentData, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { UserData } from "@/types/auth";
import SeasonRouteLoading from "@/app/seasons/[id]/loading";
import RateLimitView from "@/components/Layout/RateLimitView";

const LATEST_SEASON = Number(process.env.NEXT_PUBLIC_LATEST_SEASON);

class SeasonListRateLimitError extends Error {
  constructor(readonly retryAfter: number | null) {
    super("Season list request was rate limited");
  }
}

interface SeasonDetailsClientProps {
  seasonId: string;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

export default function SeasonDetailsClient({
  seasonId,
  initialComments = [],
  initialUserMap = {},
}: SeasonDetailsClientProps) {
  const router = useRouter();
  const [currentSeasonState, setCurrentSeasonState] = useState<Season | null>(
    null,
  );
  const seasonsQuery = useQuery({
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
  const seasonList = seasonsQuery.data;
  const matchedSeason = seasonList?.find(
    (season) => season.season.toString() === seasonId,
  );

  useEffect(() => {
    if (!matchedSeason || !seasonList) return;
    if (
      typeof matchedSeason.rewards === "string" ||
      !Array.isArray(matchedSeason.rewards) ||
      matchedSeason.rewards.length === 0
    ) {
      const latestSeason = seasonList.find((season) => season.is_current === 1);
      router.replace(`/seasons/${latestSeason?.season ?? LATEST_SEASON}`);
      return;
    }
    setCurrentSeasonState(matchedSeason);
    // router from nextjs-toploader/app returns a new object reference on every
    // render, so including it here would re-trigger the redirect.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId, matchedSeason, seasonList]);

  if (!seasonList && seasonsQuery.error instanceof SeasonListRateLimitError) {
    return <RateLimitView retryAfter={seasonsQuery.error.retryAfter} />;
  }

  if ((seasonsQuery.isError && !seasonList) || (seasonList && !matchedSeason)) {
    notFound();
  }

  if (!seasonList || !currentSeasonState) {
    return <SeasonRouteLoading />;
  }

  const season = currentSeasonState;
  const latestSeasonNumber =
    seasonList.find((s) => s.is_current === 1)?.season ?? LATEST_SEASON;

  const filteredSeasonList = seasonList
    .filter((s: Season) => {
      if (typeof s.rewards === "string") {
        return false;
      }
      return Array.isArray(s.rewards) && s.rewards.length > 0;
    })
    .map((s: Season) => ({ season: s.season, title: s.title }))
    .sort(
      (
        a: { season: number; title: string },
        b: { season: number; title: string },
      ) => b.season - a.season,
    );

  const currentSeasonForHeader =
    seasonList.find((s: Season) => s.season === latestSeasonNumber) || null;
  const nextSeasonForHeader =
    seasonList.find((s: Season) => s.season === latestSeasonNumber + 1) || null;

  const setSeasonDocumentTitle = (s: Pick<Season, "season" | "title">) => {
    document.title = `Season ${s.season}: ${s.title} | Jailbreak Changelogs`;
  };

  const handleSeasonSelect = async (selectedId: string) => {
    const selectedSeason = seasonList.find(
      (s) =>
        s.season.toString() === selectedId ||
        s.season === parseInt(selectedId, 10),
    );

    if (selectedSeason) {
      if (
        typeof selectedSeason.rewards === "string" ||
        !Array.isArray(selectedSeason.rewards) ||
        selectedSeason.rewards.length === 0
      ) {
        router.replace(`/seasons/${latestSeasonNumber}`);
        return;
      }

      window.history.pushState({}, "", `/seasons/${selectedId}`);
      setCurrentSeasonState(selectedSeason);
      setSeasonDocumentTitle(selectedSeason);
    } else {
      router.replace(`/seasons/${selectedId}`);
    }
  };

  const handleGoToLatestSeason = () => {
    const currentSeason = seasonList.find((s) => s.is_current === 1);

    if (currentSeason) {
      window.history.pushState({}, "", `/seasons/${currentSeason.season}`);
      setCurrentSeasonState(currentSeason);
      setSeasonDocumentTitle(currentSeason);
    } else {
      router.push(`/seasons/${latestSeasonNumber}`);
    }
  };

  const startDate =
    season.start_date > 0 ? new Date(season.start_date * 1000) : null;
  const endDate = season.end_date > 0 ? new Date(season.end_date * 1000) : null;
  const isLatest = season.season === latestSeasonNumber;
  const rewards = sortRewards(season.rewards);
  const imageRewards = rewards.filter(hasRewardImage);
  const bonusRewards = rewards.filter((r) => !hasRewardImage(r));
  const lightboxImages = imageRewards.map((r) => ({
    src: rewardImageUrl(r),
    alt: r.item,
  }));

  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb />

        <section className="border-border-card mb-8 flex flex-col gap-6 border-b pb-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="page-heading">
                <span className="text-secondary-text flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                  Season {season.season}
                  {isLatest && (
                    <span className="bg-status-success text-button-success-text inline-flex h-5 items-center rounded-md px-2 text-xs leading-none font-bold normal-case">
                      Latest
                    </span>
                  )}
                </span>
                {season.title}
              </h1>
              <SeasonNavigation
                seasonList={filteredSeasonList}
                selectedId={season.season.toString()}
                onSeasonSelect={handleSeasonSelect}
              />
            </div>

            <p className="text-secondary-text mt-2 flex items-center gap-1.5 text-sm">
              <Icon
                icon="heroicons:calendar-days"
                className="h-4 w-4"
                inline={true}
              />
              {startDate && endDate
                ? `${formatProfileDate(startDate.getTime())} – ${formatProfileDate(endDate.getTime())} · ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                : "Dates TBD"}
            </p>
            <p className="text-secondary-text mt-4 max-w-3xl">
              {season.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {isLatest ? (
                <>
                  <Button asChild size="sm">
                    <Link href="/seasons/will-i-make-it">
                      <Icon icon="heroicons:calculator" inline={true} />
                      XP Calculator
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/seasons/contracts">
                      <Icon
                        icon="heroicons:clipboard-document-list"
                        inline={true}
                      />
                      Weekly Contracts
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGoToLatestSeason}
                >
                  <Icon icon="heroicons:arrow-uturn-right" inline={true} />
                  Go to Latest Season
                </Button>
              )}
            </div>
          </div>
          {/* Nitro: video-nc unit should sit above the fold */}
          <NitroInlineVideoPlayer
            slotId="np-seasons-video"
            className="lg:mx-0 lg:w-80 lg:shrink-0"
          />
        </section>

        {/* Countdown first on mobile; on xl it sits atop the sidebar */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:grid-rows-[auto_1fr] xl:gap-y-0">
          {/* empty:hidden drops the slot when SeasonCountdown renders nothing */}
          <div className="empty:hidden xl:col-span-4 xl:col-start-9 xl:row-start-1 xl:mb-8">
            <SeasonCountdown
              viewedSeason={season.season}
              currentSeason={currentSeasonForHeader}
              nextSeason={nextSeasonForHeader}
            />
          </div>
          <div className="xl:col-span-8 xl:col-start-1 xl:row-span-2 xl:row-start-1">
            <h2 className="text-primary-text mb-4 text-2xl font-bold tracking-tight">
              Rewards
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {imageRewards.map((reward, index) => (
                <div
                  key={reward.id}
                  className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border"
                >
                  <ImageLightbox
                    images={lightboxImages}
                    initialIndex={index}
                    alt={reward.item}
                    previewRadius="rounded-none"
                    className="w-full"
                  >
                    {/* Natural ratio: banners vary (~1.75–1.94:1), a fixed box crops or letterboxes */}
                    <Image
                      placeholder={IMAGE_PLACEHOLDER}
                      src={rewardImageUrl(reward)}
                      alt={reward.item}
                      width={1037}
                      height={534}
                      className="h-auto w-full"
                      fetchPriority={index < 3 ? "high" : "auto"}
                      sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 22vw"
                    />
                  </ImageLightbox>
                  <div className="p-3">
                    <h3 className="text-primary-text text-sm font-semibold sm:text-base">
                      {reward.item}
                    </h3>
                    <RewardBadges reward={reward} />
                  </div>
                </div>
              ))}
            </div>

            {bonusRewards.length > 0 && (
              <>
                <h2 className="text-primary-text mt-8 mb-4 text-xl font-bold tracking-tight">
                  Bonus Levels
                </h2>
                <ul className="border-border-card bg-secondary-bg divide-border-card divide-y rounded-lg border">
                  {bonusRewards.map((reward) => (
                    <li
                      key={reward.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <span className="text-primary-text font-medium">
                        {reward.item}
                      </span>
                      <RewardBadges reward={reward} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="xl:col-span-4 xl:col-start-9 xl:row-start-2">
            <ChangelogComments
              changelogId={season.season}
              changelogTitle={season.title}
              type="season"
              initialComments={initialComments}
              initialUserMap={initialUserMap}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function RewardBadges({ reward }: { reward: Reward }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="bg-status-success text-button-success-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
        {reward.requirement}
      </span>
      {reward.exclusive === "True" && (
        <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
          Season Pass
        </span>
      )}
      {reward.bonus === "True" && hasRewardImage(reward) && (
        <span className="text-primary-text border-border-card bg-tertiary-bg inline-flex h-6 items-center rounded-md border px-2 text-xs leading-none font-medium">
          Bonus
        </span>
      )}
    </div>
  );
}
