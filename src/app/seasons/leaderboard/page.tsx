"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonLeaderboardClient from "@/components/Leaderboard/SeasonLeaderboardClient";
import SeasonLeaderboardLoading from "@/app/seasons/leaderboard/loading";
import Link from "next/link";
import { Icon } from "@iconify/react";
import SeasonHeader from "@/components/Leaderboard/SeasonLeaderboardHeader";
import NitroSeasonsLeaderboardRailAd from "@/components/Ads/NitroSeasonsLeaderboardRailAd";
import { Season } from "@/types/seasons";
import {
  PUBLIC_API_URL,
  INVENTORY_API_URL,
  INVENTORY_API_SOURCE_HEADER,
} from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";

interface SeasonLeaderboardEntry {
  id: number;
  total_exp: number;
  name: string;
  lvl: number;
  exp: number;
}

export default function SeasonLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<
    SeasonLeaderboardEntry[] | null
  >(null);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const [latestSeason, setLatestSeason] = useState<Season | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leaderboardRes, seasonRes] = await Promise.all([
          fetch(`${INVENTORY_API_URL}/seasons/leaderboard`, {
            headers: {
              "User-Agent": "JailbreakChangelogs-Inventory/1.0",
              "X-Source": INVENTORY_API_SOURCE_HEADER,
            },
          }),
          fetch(buildApiUrlWithDevToken(PUBLIC_API_URL!, "/seasons/latest"), {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Seasons/1.0",
            },
          }),
        ]);

        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json();
          setLeaderboard(data.data ?? []);
          setUpdatedAt(data.updated_at ?? 0);
        } else {
          setLeaderboard([]);
        }

        if (seasonRes.ok) {
          setLatestSeason(await seasonRes.json());
        }
      } catch (error) {
        console.error("Error loading leaderboard data:", error);
        setLeaderboard([]);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadData();
  }, []);

  if (!isLoaded) {
    return (
      <>
        <NitroSeasonsLeaderboardRailAd />
        <SeasonLeaderboardLoading />
      </>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <>
        <NitroSeasonsLeaderboardRailAd />
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
      <NitroSeasonsLeaderboardRailAd />
      <main className="mb-8 min-h-screen">
        <div className="container mx-auto px-4">
          <Breadcrumb />

          <div className="mb-8">
            <SeasonHeader latestSeason={latestSeason} />

            <p className="text-secondary-text mt-2">
              Top 25 players ranked by their total xp
            </p>
          </div>

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
