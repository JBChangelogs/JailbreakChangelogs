"use client";

import { getExpFromLevel } from "@/utils/seasonXp";
import SeasonXpBar from "@/components/Seasons/SeasonXpBar";
import { Season } from "@/types/seasons";

interface XpProgressBarProps {
  currentLevel: number;
  currentXp: number;
  season: Season | null;
  bgStyle?: "primary" | "secondary" | "tertiary" | "quaternary";
  seasonRateLimitMessage?: string;
  mobileSecondaryTextMode?: "season" | "xp";
}

export default function XpProgressBar({
  currentLevel,
  currentXp,
  season,
  bgStyle = "primary",
  seasonRateLimitMessage,
  mobileSecondaryTextMode = "season",
}: XpProgressBarProps) {
  if (!season || !season.xp_data || !season.xp_data.xp_rates) {
    if (seasonRateLimitMessage) {
      return (
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm">
          <span className="text-primary-text">{seasonRateLimitMessage}</span>
        </div>
      );
    }
    return null;
  }

  const totalXpForCurrentLevel = getExpFromLevel(season, currentLevel);
  const totalXpForNextLevel = getExpFromLevel(season, currentLevel + 1);
  const xpRequiredForNextLevel = totalXpForNextLevel - totalXpForCurrentLevel;

  // currentXp is the XP progress within the current level (like the XP calculator)
  const currentXpInLevel = currentXp;

  const progressPercentage = Math.min(
    100,
    Math.max(0, (currentXpInLevel / xpRequiredForNextLevel) * 100),
  );

  if (xpRequiredForNextLevel <= 0) {
    return null;
  }

  const mobileSecondaryText =
    mobileSecondaryTextMode === "xp"
      ? `${currentXpInLevel.toLocaleString("en-US")}/${xpRequiredForNextLevel.toLocaleString("en-US")} XP`
      : `SEASON ${season?.season || "?"}`;

  return (
    <div className="mt-3">
      <SeasonXpBar
        percent={progressPercentage}
        xpLabel={`${currentXpInLevel.toLocaleString("en-US")}/${xpRequiredForNextLevel.toLocaleString("en-US")}`}
        level={currentLevel}
        season={season.season}
        mobileSecondaryText={mobileSecondaryText}
        bgStyle={bgStyle}
      />
    </div>
  );
}
