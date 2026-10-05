"use client";

import NitroRailFallbackAd from "@/components/Ads/NitroRailFallbackAd";

import React from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Icon } from "@/components/ui/IconWrapper";
import XpCalculator from "@/components/Seasons/XpCalculator";
import XpImportantDates from "@/components/Seasons/XpImportantDates";
import XpLevelRequirements from "@/components/Seasons/XpLevelRequirements";
import WillIMakeItLoading from "@/app/seasons/will-i-make-it/loading";
import RateLimitView from "@/components/Layout/RateLimitView";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import { SeasonRateLimitError, useLatestSeason } from "@/hooks/useLatestSeason";

export default function WillIMakeItPage() {
  const seasonQuery = useLatestSeason();
  const season = seasonQuery.data;
  const rateLimitError =
    seasonQuery.error instanceof SeasonRateLimitError
      ? seasonQuery.error
      : null;

  if (rateLimitError && !season) {
    return (
      <>
        <NitroRailAd
          adIdSmall="np-seasons-calculator-rail"
          adIdWide="np-seasons-calculator-rail-wide"
        />
        <NitroRailAd
          adIdSmall="np-seasons-calculator-rail-right"
          adIdWide="np-seasons-calculator-rail-right-wide"
          side="right"
        />
        <RateLimitView retryAfter={rateLimitError.retryAfter} />
      </>
    );
  }

  if (seasonQuery.isPending) {
    return (
      <>
        <NitroRailAd
          adIdSmall="np-seasons-calculator-rail"
          adIdWide="np-seasons-calculator-rail-wide"
        />
        <NitroRailAd
          adIdSmall="np-seasons-calculator-rail-right"
          adIdWide="np-seasons-calculator-rail-right-wide"
          side="right"
        />
        <WillIMakeItLoading />
      </>
    );
  }

  if (!season) {
    return (
      <>
        <NitroRailAd
          adIdSmall="np-seasons-calculator-rail"
          adIdWide="np-seasons-calculator-rail-wide"
        />
        <NitroRailAd
          adIdSmall="np-seasons-calculator-rail-right"
          adIdWide="np-seasons-calculator-rail-right-wide"
          side="right"
        />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-primary-text text-xl">
            Error:{" "}
            {seasonQuery.isError
              ? "Failed to load season data"
              : "Season data not available"}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NitroRailAd
        adIdSmall="np-seasons-calculator-rail"
        adIdWide="np-seasons-calculator-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-seasons-calculator-rail-right"
        adIdWide="np-seasons-calculator-rail-right-wide"
        side="right"
      />
      <div className="mb-8 min-h-screen">
        <div className="container mx-auto px-4">
          <Breadcrumb />

          <div className="mb-2 flex items-center gap-3">
            <h1 className="page-heading">Will I Make It to Level 10?</h1>
          </div>
          <p className="text-secondary-text mb-8 text-lg">
            Calculate your chances of reaching level 10 in Season{" "}
            {season.season}: {season.title}
          </p>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
              <XpImportantDates
                season={season.season}
                title={season.title}
                startDate={season.start_date}
                endDate={season.end_date}
                doubleXpStart={
                  season.end_date - season.xp_data.doubleXpDuration
                }
                seasonEnds={season.end_date}
              />
            </div>

            <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
              <h3 className="text-primary-text mb-3 flex items-center gap-2 text-lg font-semibold">
                <Icon
                  icon="emojione:light-bulb"
                  className="text-lg text-yellow-500"
                />
                How This Calculator Works
              </h3>
              <ul className="text-secondary-text list-inside list-disc space-y-2 text-sm">
                <li>
                  <strong>Current Level:</strong> Your current season level
                  (1-9)
                </li>
                <li>
                  <strong>Current XP:</strong> XP progress within your current
                  level
                </li>
                <li>
                  <strong>Season Pass:</strong> Whether you have the premium
                  season pass
                </li>
                <li>
                  <strong>Target Level:</strong> The level you want to reach
                  (usually level 10)
                </li>
                <li>
                  <strong>Double XP:</strong> Special periods with 2x XP gains
                </li>
              </ul>
              <div className="text-secondary-text mt-3 text-xs">
                <p>
                  <strong>Tip:</strong> The calculator considers daily XP
                  limits, contract rewards, and season timing to give you the
                  most accurate estimate.
                </p>
              </div>
            </div>
          </div>

          <NitroRailFallbackAd adId="np-seasons-calculator-rail-fallback" />

          <XpCalculator season={season} />

          <div className="mt-6">
            <XpLevelRequirements season={season} />
          </div>
        </div>
      </div>
    </>
  );
}
