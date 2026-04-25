"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonHeader from "@/components/Seasons/SeasonHeader";
import SeasonNavigation from "@/components/Seasons/SeasonNavigation";
import { Icon } from "@/components/ui/IconWrapper";
import ImageGallery from "@/components/Seasons/ImageGallery";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatProfileDate } from "@/utils/timestamp";
import { Season, CommentData, PUBLIC_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import { UserData } from "@/types/auth";
import SeasonRouteLoading from "@/app/seasons/[id]/loading";
import RateLimitView from "@/components/Layout/RateLimitView";

const LATEST_SEASON = 31;

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
  const [seasonList, setSeasonList] = useState<Season[] | null>(null);
  const [currentSeasonState, setCurrentSeasonState] = useState<Season | null>(
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

        const response = await fetch(
          buildApiUrlWithDevToken(PUBLIC_API_URL, "/seasons"),
          {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Seasons/1.0",
            },
          },
        );

        if (!response.ok) {
          if (response.status === 429) {
            const raw = response.headers.get("retry-after");
            setIsRateLimited(true);
            setRateLimitRetryAfter(raw ? parseInt(raw, 10) : null);
            return;
          }
          throw new Error("Failed to fetch season list");
        }

        const data = (await response.json()) as Season[];

        const matched = data.find(
          (s) =>
            s.season.toString() === seasonId ||
            s.season === parseInt(seasonId, 10),
        );

        if (!matched) {
          setIsNotFound(true);
          return;
        }

        if (
          typeof matched.rewards === "string" ||
          !Array.isArray(matched.rewards) ||
          matched.rewards.length === 0
        ) {
          const latestSeason = data.find((s) => s.is_current === 1);
          router.replace(`/seasons/${latestSeason?.season ?? LATEST_SEASON}`);
          return;
        }

        setSeasonList(data);
        setCurrentSeasonState(matched);
      } catch (error) {
        console.error("Error loading season data:", error);
        setIsNotFound(true);
      }
    };

    void loadPageData();
  }, [seasonId, router]);

  if (isRateLimited) {
    return <RateLimitView retryAfter={rateLimitRetryAfter} />;
  }

  if (isNotFound) {
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
    } else {
      router.replace(`/seasons/${selectedId}`);
    }
  };

  const handleGoToLatestSeason = () => {
    const currentSeason = seasonList.find((s) => s.is_current === 1);

    if (currentSeason) {
      window.history.pushState({}, "", `/seasons/${currentSeason.season}`);
      setCurrentSeasonState(currentSeason);
    } else {
      router.push(`/seasons/${latestSeasonNumber}`);
    }
  };

  const startDate =
    season.start_date > 0 ? new Date(season.start_date * 1000) : null;
  const endDate = season.end_date > 0 ? new Date(season.end_date * 1000) : null;

  return (
    <>
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <SeasonHeader
            currentSeason={currentSeasonForHeader}
            nextSeason={nextSeasonForHeader}
          />
          <SeasonNavigation
            seasonList={filteredSeasonList}
            selectedId={season.season.toString()}
            onSeasonSelect={handleSeasonSelect}
          />

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
            <div className="sm:col-span-12 xl:col-span-8">
              <h1 className="border-secondary-text text-primary-text mb-8 border-b pb-4 text-3xl font-bold tracking-tight sm:text-5xl">
                Season {season.season} / {season.title}
              </h1>
              <p className="text-secondary-text mb-4">{season.description}</p>

              {/* Go to Current Season - Only show when not on latest */}
              {season.season !== latestSeasonNumber && (
                <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <h3 className="text-primary-text mb-2 text-lg font-semibold">
                        Go to Current Season
                      </h3>
                      <p className="text-secondary-text text-sm">
                        Jump to the latest season to see current rewards and
                        weekly contracts.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button
                        type="button"
                        onClick={handleGoToLatestSeason}
                        className="w-full lg:w-auto"
                      >
                        <Icon
                          icon="heroicons:clock"
                          className="h-4 w-4"
                          inline={true}
                        />
                        <span>Go to Current Season</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* XP Calculator Button - Only show for highest season */}
              {season.season === latestSeasonNumber && (
                <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <h3 className="text-primary-text mb-2 text-lg font-semibold">
                        🎯 XP Progress Calculator
                      </h3>
                      <p className="text-secondary-text text-sm">
                        Calculate how long it will take to reach your target
                        level and see if you can complete the season on time.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button asChild className="w-full lg:w-auto">
                        <Link href="/seasons/will-i-make-it">
                          Calculate My Progress
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Contracts Promo - Only show for highest season */}
              {season.season === latestSeasonNumber && (
                <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <h3 className="text-primary-text mb-2 text-lg font-semibold">
                        📋 Weekly Contracts
                      </h3>
                      <p className="text-secondary-text text-sm">
                        View your weekly contracts and their xp rewards.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button asChild className="w-full lg:w-auto">
                        <Link href="/seasons/contracts">View Contracts</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                  <h3 className="text-primary-text mb-2 font-semibold">
                    Start Date
                  </h3>
                  <p className="text-secondary-text">
                    {startDate ? formatProfileDate(startDate.getTime()) : "TBD"}
                  </p>
                </div>
                <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                  <h3 className="text-primary-text mb-2 font-semibold">
                    End Date
                  </h3>
                  <p className="text-secondary-text">
                    {endDate ? formatProfileDate(endDate.getTime()) : "TBD"}
                  </p>
                </div>
                <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
                  <h3 className="text-primary-text mb-2 font-semibold">
                    Duration
                  </h3>
                  <p className="text-secondary-text">
                    {startDate && endDate
                      ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                      : "TBD"}
                  </p>
                </div>
              </div>

              <h2 className="border-secondary-text text-primary-text mb-4 border-b pb-2 text-2xl font-bold tracking-tight">
                Season Rewards
              </h2>
              <div className="space-y-4">
                {season.rewards
                  .sort((a, b) => {
                    const isPercentageA = a.requirement
                      .toLowerCase()
                      .includes("%");
                    const isPercentageB = b.requirement
                      .toLowerCase()
                      .includes("%");

                    if (isPercentageA && !isPercentageB) return 1;
                    if (!isPercentageA && isPercentageB) return -1;

                    if (isPercentageA && isPercentageB) {
                      const percentA = parseInt(
                        a.requirement.match(/\d+/)?.[0] || "0",
                      );
                      const percentB = parseInt(
                        b.requirement.match(/\d+/)?.[0] || "0",
                      );
                      return percentA - percentB;
                    }

                    const levelA = parseInt(
                      a.requirement.match(/\d+/)?.[0] || "0",
                    );
                    const levelB = parseInt(
                      b.requirement.match(/\d+/)?.[0] || "0",
                    );
                    return levelA - levelB;
                  })
                  .map((reward) => (
                    <div
                      key={reward.id}
                      className="border-border-card bg-secondary-bg rounded-lg border p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-primary-text font-semibold">
                          {reward.item}
                        </h3>
                        <div className="flex gap-2">
                          {reward.bonus === "True" && (
                            <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                              Bonus
                            </span>
                          )}
                          {reward.exclusive === "True" && (
                            <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                              Exclusive
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-secondary-text text-sm">
                        Requirement: {reward.requirement}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right side - Image Gallery and Comments */}
            <div className="space-y-8 sm:col-span-12 xl:col-span-4">
              <ImageGallery rewards={season.rewards} />
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
    </>
  );
}
