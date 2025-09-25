import React from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchLatestSeason } from "@/utils/api";
import XpCalculator from "@/components/Seasons/XpCalculator";
import XpImportantDates from "@/components/Seasons/XpImportantDates";
import XpLevelRequirements from "@/components/Seasons/XpLevelRequirements";
import { Season } from "@/types/seasons";

export default async function WillIMakeItPage() {
  let season: Season | null = null;
  let error: string | null = null;

  try {
    season = await fetchLatestSeason();
    if (!season) {
      error = "Failed to load season data";
    }
  } catch (err) {
    console.error("Error loading season data:", err);
    error = "Failed to load season data";
  }

  if (error || !season) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-primary-text text-xl">
          Error: {error || "Season data not available"}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />

        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-primary-text text-4xl font-bold">
            Will I Make It to Level 10?
          </h1>
          <span className="bg-button-info text-form-button-text rounded px-2 py-1 text-[12px] font-semibold uppercase">
            New
          </span>
        </div>
        <p className="text-secondary-text mb-8 text-lg">
          Calculate your chances of reaching level 10 in Season {season.season}:{" "}
          {season.title}
        </p>

        {/* Season Info & Calculator Info Side by Side */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Season Info & Countdown Section */}
          <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-6">
            <XpImportantDates
              season={season.season}
              title={season.title}
              startDate={season.start_date}
              endDate={season.end_date}
              doubleXpStart={season.end_date - season.xp_data.doubleXpDuration}
              seasonEnds={season.end_date}
            />
          </div>

          {/* Calculator Info Section */}
          <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4">
            <h3 className="text-primary-text mb-3 text-lg font-semibold">
              💡 How This Calculator Works
            </h3>
            <ul className="text-secondary-text list-inside list-disc space-y-2 text-sm">
              <li>
                <strong>Current Level:</strong> Your current season level (1-9)
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
                <strong>Tip:</strong> The calculator considers daily XP limits,
                contract rewards, and season timing to give you the most
                accurate estimate.
              </p>
            </div>
          </div>
        </div>

        {/* Main XP Calculator - Primary Feature */}
        <XpCalculator season={season} />

        {/* XP Requirements by Level - Reference Information */}
        <div className="mt-6">
          <XpLevelRequirements season={season} />
        </div>
      </div>
    </div>
  );
}
