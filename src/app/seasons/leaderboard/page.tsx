"use client";

import NitroRailFallbackAd from "@/components/Ads/NitroRailFallbackAd";

import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonLeaderboardClient from "@/components/Leaderboard/SeasonLeaderboardClient";
import SeasonLeaderboardLoading from "@/app/seasons/leaderboard/loading";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import SeasonHeader from "@/components/Leaderboard/SeasonLeaderboardHeader";
import {
  INVENTORY_API_URL,
  INVENTORY_API_SOURCE_HEADER,
} from "@/utils/api/api";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import { SeasonRateLimitError, useLatestSeason } from "@/hooks/useLatestSeason";

interface SeasonLeaderboardEntry {
  id: number;
  total_exp: number;
  name: string;
  lvl: number;
  exp: number;
}

export default function SeasonLeaderboardPage() {
  const seasonQuery = useLatestSeason();
  const leaderboardQuery = useQuery({
    queryKey: ["season-leaderboard"],
    queryFn: async ({
      signal,
    }): Promise<{ data: SeasonLeaderboardEntry[]; updated_at: number }> => {
      const response = await fetch(`${INVENTORY_API_URL}/seasons/leaderboard`, {
        signal,
        headers: {
          "User-Agent": "JailbreakChangelogs-Inventory/1.0",
          "X-Source": INVENTORY_API_SOURCE_HEADER,
        },
      });
      if (!response.ok)
        throw new Error(`Leaderboard request failed (${response.status})`);
      return response.json();
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const leaderboard = leaderboardQuery.data?.data ?? [];
  const updatedAt = leaderboardQuery.data?.updated_at ?? 0;
  const latestSeason = seasonQuery.data ?? null;
  const seasonRateLimitError =
    seasonQuery.error instanceof SeasonRateLimitError
      ? seasonQuery.error
      : null;

  if (leaderboardQuery.isPending || seasonQuery.isPending) {
    return (
      <>
        <NitroRailAd
          adIdSmall="np-seasons-leaderboard-rail"
          adIdWide="np-seasons-leaderboard-rail-wide"
        />
        <NitroRailAd
          adIdSmall="np-seasons-leaderboard-rail-right"
          adIdWide="np-seasons-leaderboard-rail-right-wide"
          side="right"
        />
        <SeasonLeaderboardLoading />
      </>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <>
        <NitroRailAd
          adIdSmall="np-seasons-leaderboard-rail"
          adIdWide="np-seasons-leaderboard-rail-wide"
        />
        <NitroRailAd
          adIdSmall="np-seasons-leaderboard-rail-right"
          adIdWide="np-seasons-leaderboard-rail-right-wide"
          side="right"
        />
        <div className="min-h-screen">
          <div className="container mx-auto px-4 pb-16">
            <Breadcrumb />

            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="border-border-card bg-secondary-bg max-w-2xl rounded-lg border p-12 text-center">
                <div className="mb-8">
                  <div className="border-button-info/30 bg-button-info/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full border">
                    <Icon
                      icon="line-md:list-3"
                      className="text-button-info h-10 w-10"
                    />
                  </div>
                </div>

                <h2 className="text-primary-text mb-4 text-2xl font-bold">
                  No Leaderboard Data Available
                </h2>

                <div className="text-secondary-text mb-8 text-lg leading-relaxed">
                  <p>
                    Check back later for the latest season leaderboard rankings.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Link
                    href="/seasons"
                    className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
                  >
                    <Icon icon="line-md:calendar" className="h-5 w-5" />
                    View Seasons
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NitroRailAd
        adIdSmall="np-seasons-leaderboard-rail"
        adIdWide="np-seasons-leaderboard-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-seasons-leaderboard-rail-right"
        adIdWide="np-seasons-leaderboard-rail-right-wide"
        side="right"
      />
      <main className="mb-8 min-h-screen">
        <div className="container mx-auto px-4">
          <Breadcrumb />

          <div className="mb-8">
            <SeasonHeader latestSeason={latestSeason} />

            <p className="text-secondary-text mt-2">
              Top 25 players ranked by their total xp
            </p>

            {seasonRateLimitError && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm">
                <Icon
                  icon="material-symbols:hourglass-outline"
                  className="text-primary-text h-4 w-4 shrink-0"
                />
                <span className="text-primary-text">
                  Season info unavailable — rate limited
                  {seasonRateLimitError.retryAfter
                    ? `. Try again in ${seasonRateLimitError.retryAfter}s`
                    : ""}
                </span>
              </div>
            )}
          </div>

          <NitroRailFallbackAd adId="np-seasons-leaderboard-rail-fallback" />

          <SeasonLeaderboardClient
            initialLeaderboard={leaderboard}
            updatedAt={updatedAt}
            season={latestSeason}
          />
        </div>
      </main>
    </>
  );
}
