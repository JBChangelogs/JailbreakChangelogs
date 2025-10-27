"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonHeader from "@/components/Seasons/SeasonHeader";
import SeasonNavigation from "@/components/Seasons/SeasonNavigation";
import ImageGallery from "@/components/Seasons/ImageGallery";
import ChangelogComments from "@/components/PageComments/ChangelogComments";
import Link from "next/link";
import { Inter } from "next/font/google";
import { formatProfileDate } from "@/utils/timestamp";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAdReloader } from "@/hooks/useAdReloader";
import { Season, CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";

const inter = Inter({ subsets: ["latin"], display: "swap" });

interface SeasonDetailsClientProps {
  seasonList: Season[];
  currentSeason: Season;
  seasonId: string;
  latestSeasonNumber: number;
  initialComments?: CommentData[];
  initialUserMap?: Record<string, UserData>;
}

export default function SeasonDetailsClient({
  seasonList,
  currentSeason,
  latestSeasonNumber,
  initialComments = [],
  initialUserMap = {},
}: SeasonDetailsClientProps) {
  const router = useRouter();
  const { user } = useAuthContext();

  // Initialize ad reloader for route changes
  useAdReloader();

  // Use state to manage the current season
  const [currentSeasonState, setCurrentSeasonState] = useState(currentSeason);

  const season = currentSeasonState;

  // Derive premium type from auth context instead of using state
  const currentUserPremiumType = user?.premiumtype || 0;

  // Get filtered season list for navigation
  const filteredSeasonList = seasonList
    .filter((s: Season) => {
      // If rewards is a string "No rewards found", treat it as empty array
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

  // Get current and next season data for header
  const currentSeasonForHeader =
    seasonList.find((s: Season) => s.season === latestSeasonNumber) || null;
  const nextSeasonForHeader =
    seasonList.find((s: Season) => s.season === latestSeasonNumber + 1) || null;

  const handleSeasonSelect = async (selectedId: string) => {
    // Find the selected season from the already fetched data
    const selectedSeason = seasonList.find(
      (season) =>
        season.season.toString() === selectedId ||
        season.season === parseInt(selectedId),
    );

    if (selectedSeason) {
      // Check if the season has valid rewards
      if (
        typeof selectedSeason.rewards === "string" ||
        !Array.isArray(selectedSeason.rewards) ||
        selectedSeason.rewards.length === 0
      ) {
        router.replace(`/seasons/${latestSeasonNumber}`);
        return;
      }

      // Update the URL without triggering a full page navigation
      window.history.pushState({}, "", `/seasons/${selectedId}`);

      // Update the current season data directly
      setCurrentSeasonState(selectedSeason);
    } else {
      // If the season is not in our list, navigate to fetch it
      router.replace(`/seasons/${selectedId}`);
    }
  };

  const handleGoToLatestSeason = () => {
    // Find the current season (is_current: 1) from the already fetched data
    const currentSeason = seasonList.find((season) => season.is_current === 1);

    if (currentSeason) {
      // Update the URL without triggering a full page navigation
      window.history.pushState({}, "", `/seasons/${currentSeason.season}`);

      // Update the current season data directly
      setCurrentSeasonState(currentSeason);
    } else {
      // Fallback to router navigation if current season not found
      router.push(`/seasons/${latestSeasonNumber}`);
    }
  };

  const startDate =
    season.start_date > 0 ? new Date(season.start_date * 1000) : null;
  const endDate = season.end_date > 0 ? new Date(season.end_date * 1000) : null;

  return (
    <>
      <style jsx>{`
        .sidebar-ad-container-season {
          width: 100%;
          max-width: 320px;
          height: 100px;
          min-width: 250px;
          border: 1px solid
            var(--color-border-border-primary hover: border-border-focus);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: block;
        }

        @media (min-width: 768px) {
          .sidebar-ad-container-season {
            width: 100%;
            max-width: 300px;
            height: 600px;
            min-width: 250px;
            display: block;
          }
        }

        @media (min-width: 1024px) {
          .sidebar-ad-container-season {
            width: 100%;
            max-width: 160px;
            height: 600px;
            min-width: 160px;
            display: block;
          }
        }
      `}</style>
      <main className="min-h-screen">
        <div className="container mx-auto mb-8 px-4 sm:px-6">
          <Breadcrumb />
          <SeasonHeader
            currentSeason={currentSeasonForHeader}
            nextSeason={nextSeasonForHeader}
          />
          <SeasonNavigation
            seasonList={filteredSeasonList}
            fullSeasonList={seasonList}
            selectedId={season.season.toString()}
            onSeasonSelect={handleSeasonSelect}
            onGoToLatestSeason={handleGoToLatestSeason}
          />

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
            <div className="sm:col-span-12 xl:col-span-8">
              <h1
                className={`${inter.className} text-primary-text border-secondary-text mb-8 border-b pb-4 text-3xl font-bold tracking-tighter sm:text-5xl`}
              >
                Season {season.season} / {season.title}
              </h1>
              <p className="text-secondary-text mb-4">{season.description}</p>

              {/* XP Calculator Button - Only show for highest season */}
              {season.season === latestSeasonNumber && (
                <div className="border-button-info bg-secondary-bg mb-6 rounded-lg border p-4">
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
                    <div className="flex-shrink-0">
                      <Link
                        href="/seasons/will-i-make-it"
                        className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors lg:w-auto"
                      >
                        Calculate My Progress
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Contracts Promo - Only show for highest season */}
              {season.season === latestSeasonNumber && (
                <div className="border-button-info bg-secondary-bg mb-6 rounded-lg border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <h3 className="text-primary-text mb-2 text-lg font-semibold">
                        📋 Weekly Contracts
                      </h3>
                      <p className="text-secondary-text text-sm">
                        View your weekly contracts and their xp rewards.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href="/seasons/contracts"
                        className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors lg:w-auto"
                      >
                        View Contracts
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
                  <h3 className="text-primary-text mb-2 font-semibold">
                    Start Date
                  </h3>
                  <p className="text-secondary-text">
                    {startDate ? formatProfileDate(startDate.getTime()) : "TBD"}
                  </p>
                </div>
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
                  <h3 className="text-primary-text mb-2 font-semibold">
                    End Date
                  </h3>
                  <p className="text-secondary-text">
                    {endDate ? formatProfileDate(endDate.getTime()) : "TBD"}
                  </p>
                </div>
                <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
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

              <h2
                className={`text-primary-text border-secondary-text mb-4 border-b pb-2 text-2xl font-bold tracking-tight ${inter.className}`}
              >
                Season Rewards
              </h2>
              <div className="space-y-4">
                {season.rewards
                  .sort((a, b) => {
                    // Check if requirements are percentage-based
                    const isPercentageA = a.requirement
                      .toLowerCase()
                      .includes("%");
                    const isPercentageB = b.requirement
                      .toLowerCase()
                      .includes("%");

                    // If one is percentage and other isn't, percentage goes last
                    if (isPercentageA && !isPercentageB) return 1;
                    if (!isPercentageA && isPercentageB) return -1;

                    // If both are percentages, sort by the percentage number
                    if (isPercentageA && isPercentageB) {
                      const percentA = parseInt(
                        a.requirement.match(/\d+/)?.[0] || "0",
                      );
                      const percentB = parseInt(
                        b.requirement.match(/\d+/)?.[0] || "0",
                      );
                      return percentA - percentB;
                    }

                    // If both are level-based, sort by level number
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
                      className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-primary-text font-semibold">
                          {reward.item}
                        </h3>
                        <div className="flex gap-2">
                          {reward.bonus === "True" && (
                            <span className="border-primary-text text-primary-text rounded-full border bg-transparent px-2 py-1 text-xs font-medium">
                              Bonus
                            </span>
                          )}
                          {reward.exclusive === "True" && (
                            <span className="border-primary-text text-primary-text rounded-full border bg-transparent px-2 py-1 text-xs font-medium">
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
              {currentUserPremiumType === 0 && (
                <div className="my-8 flex flex-col items-center">
                  <span className="text-secondary-text mb-2 block text-center text-xs">
                    ADVERTISEMENT
                  </span>
                  <div className="sidebar-ad-container-season">
                    <DisplayAd
                      adSlot="2909908750"
                      adFormat="auto"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </div>
                  <AdRemovalNotice className="mt-2" />
                </div>
              )}
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
