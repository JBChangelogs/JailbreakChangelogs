import { fetchSeasonLeaderboard, fetchLatestSeason } from "@/utils/api";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonLeaderboardClient from "@/components/Leaderboard/SeasonLeaderboardClient";
import Link from "next/link";
import { Icon } from "@iconify/react";

export const revalidate = 300; // Revalidate every 5 minutes

export default async function SeasonLeaderboardPage() {
  const [leaderboardResponse, latestSeason] = await Promise.all([
    fetchSeasonLeaderboard(),
    fetchLatestSeason(),
  ]);

  // Show fallback if no data
  if (!leaderboardResponse.data || leaderboardResponse.data.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pb-16">
          <Breadcrumb />

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="bg-secondary-bg border-border-primary max-w-2xl rounded-lg border p-12 text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="border-button-info/30 bg-button-info/20 mx-auto flex h-20 w-20 items-center justify-center rounded-full border">
                  <Icon
                    icon="line-md:list-3"
                    className="text-button-info h-10 w-10"
                  />
                </div>
              </div>

              {/* Main heading */}
              <h2 className="text-primary-text mb-4 text-2xl font-bold">
                No Leaderboard Data Available
              </h2>

              {/* Simple message */}
              <div className="text-secondary-text mb-8 text-lg leading-relaxed">
                <p>
                  Check back later for the latest season leaderboard rankings.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center">
                <Link
                  href="/seasons"
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
                >
                  <Icon icon="line-md:calendar" className="h-5 w-5" />
                  View Seasons
                </Link>
              </div>

              {/* Additional helpful info */}
              <div className="mt-8">
                <div className="border-button-info bg-button-info/10 rounded-lg border p-3 sm:p-4">
                  <div className="text-primary-text flex items-start gap-2 text-xs sm:text-sm">
                    <Icon
                      icon="emojione:light-bulb"
                      className="text-button-info flex-shrink-0 text-base sm:text-lg"
                    />
                    <span className="font-medium leading-relaxed">
                      Pro Tip: The leaderboard updates every hour during active
                      seasons.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-primary-text text-3xl font-bold">
              {latestSeason
                ? `Season ${latestSeason.season} / ${latestSeason.title} Season Leaderboard`
                : "Season Leaderboard"}
            </h1>
          </div>
          <p className="text-secondary-text mt-2">
            Top 25 players ranked by their total xp
          </p>
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-primary-text text-sm">
              <span className="font-semibold">Note:</span> Leaderboard updates
              every 1 hour.
            </p>
          </div>
        </div>

        <SeasonLeaderboardClient
          initialLeaderboard={leaderboardResponse.data}
          updatedAt={leaderboardResponse.updated_at}
          season={latestSeason}
        />
      </div>
    </main>
  );
}
