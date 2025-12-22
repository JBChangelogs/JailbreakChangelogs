import React from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonContractsClient from "@/components/Seasons/SeasonContractsClient";
import WeeklyContractsCountdown from "@/components/Seasons/WeeklyContractsCountdown";
import { fetchLatestSeason } from "@/utils/api";
import { fetchSeasonContracts } from "@/utils/api";
import { Icon } from "@iconify/react";

export const revalidate = 300; // Revalidate every 5 minutes

// Calculate current timestamp outside component to avoid impure function during render
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export default async function SeasonContractsPage() {
  const [contractsData, latestSeason] = await Promise.all([
    fetchSeasonContracts(),
    fetchLatestSeason(),
  ]);

  // Check if season has ended first (prioritize this over no contracts)
  const seasonEnded = latestSeason?.end_date
    ? getCurrentTimestamp() >= latestSeason.end_date
    : false;

  if (seasonEnded) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pb-16">
          <Breadcrumb />

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="border-border-primary bg-secondary-bg max-w-2xl rounded-lg border p-12 text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="bg-button-info/20 border-button-info/30 mx-auto flex h-20 w-20 items-center justify-center rounded-full border">
                  <Icon
                    icon="line-md:calendar"
                    className="text-button-info h-10 w-10"
                  />
                </div>
              </div>

              {/* Main heading */}
              <h2 className="text-primary-text mb-4 text-2xl font-bold">
                {latestSeason?.title
                  ? `Season ${latestSeason.season} / ${latestSeason.title}`
                  : "Season"}{" "}
                Has Ended
              </h2>

              {/* Simple message */}
              <div className="text-secondary-text mb-8 text-lg leading-relaxed">
                <p>Check back next season for new weekly contracts.</p>
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
                <div className="bg-button-info/10 border-button-info rounded-lg border p-3 sm:p-4">
                  <div className="text-primary-text flex items-start gap-2 text-xs sm:text-sm">
                    <Icon
                      icon="emojione:light-bulb"
                      className="text-button-info shrink-0 text-base sm:text-lg"
                    />
                    <span className="leading-relaxed font-medium">
                      Helpful Tip: New seasons typically start shortly after the
                      previous one ends.
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

  if (
    !contractsData ||
    !contractsData.data ||
    contractsData.data.length === 0
  ) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 pb-16">
          <Breadcrumb />

          {/* Enhanced Empty State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="border-border-primary bg-secondary-bg max-w-2xl rounded-lg border p-12 text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="bg-button-info/20 border-button-info/30 mx-auto flex h-20 w-20 items-center justify-center rounded-full border">
                  <Icon
                    icon="line-md:document"
                    className="text-button-info h-10 w-10"
                  />
                </div>
              </div>

              {/* Main heading */}
              <h2 className="text-primary-text mb-4 text-2xl font-bold">
                No Contracts Available
              </h2>

              {/* Simple message */}
              <div className="text-secondary-text mb-8 text-lg leading-relaxed">
                <p>Check back later for the latest weekly contracts.</p>
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
                <div className="bg-button-info/10 border-button-info rounded-lg border p-3 sm:p-4">
                  <div className="text-primary-text flex items-start gap-2 text-xs sm:text-sm">
                    <Icon
                      icon="emojione:light-bulb"
                      className="text-button-info shrink-0 text-base sm:text-lg"
                    />
                    <span className="leading-relaxed font-medium">
                      Helpful Tip: Contracts are updated weekly during active
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-16">
        <Breadcrumb />

        {/* Countdown Section */}
        <div className="mb-12">
          <WeeklyContractsCountdown season={latestSeason} />
        </div>

        <SeasonContractsClient
          contracts={contractsData.data}
          updatedAt={contractsData.updated_at}
        />
      </div>
    </div>
  );
}
