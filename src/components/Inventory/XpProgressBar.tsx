"use client";

import { Season } from "@/types/seasons";

interface XpProgressBarProps {
  currentLevel: number;
  currentXp: number;
  season: Season | null;
  bgStyle?: "primary" | "secondary";
}

export default function XpProgressBar({
  currentLevel,
  currentXp,
  season,
  bgStyle = "primary",
}: XpProgressBarProps) {
  // If no season data, don't show the progress bar
  if (!season || !season.xp_data || !season.xp_data.xp_rates) {
    return null;
  }

  const xpData = season.xp_data;

  // Constants from the season data
  const constants = {
    MAX_DAILY_EXP: xpData.xp_rates.maxDailyXp,
    MAX_DAILY_EXP_SEASON_PASS: xpData.xp_rates.maxDailyXpWithPass,
    AVG_EXP_PER_CONTRACT: xpData.xp_rates.avgXpPerContract,
    TOTAL_DAYS: xpData.xp_rates.totalDays,
    CONTRACTS_PER_DAY: xpData.xp_rates.contractsPerDay,
    EFFICIENCY: xpData.xp_rates.efficiency,
    CURVE_K: xpData.xp_rates.curveK,
  };

  // Calculate total possible XP
  const totalPossibleExp =
    constants.EFFICIENCY *
    (constants.AVG_EXP_PER_CONTRACT *
      constants.CONTRACTS_PER_DAY *
      constants.TOTAL_DAYS +
      constants.MAX_DAILY_EXP * constants.TOTAL_DAYS);

  // Function to get XP required for a level
  function getExpFromLevel(targetLevel: number) {
    if (targetLevel <= 0) return 0;

    const curveK = constants.CURVE_K;
    let result;

    if (curveK === 1) {
      result = totalPossibleExp / (xpData.targetLevel - 1);
    } else {
      result =
        (totalPossibleExp * (1 - curveK)) /
        (1 - Math.pow(curveK, xpData.targetLevel - 1));
    }

    let calculatedExp;
    if (curveK === 1) {
      calculatedExp = result * (targetLevel - 1);
    } else {
      calculatedExp =
        (result * (1 - Math.pow(curveK, targetLevel - 1))) / (1 - curveK);
    }

    let roundedExp = Math.floor(calculatedExp);
    if (0.5 <= calculatedExp - roundedExp) {
      roundedExp += 1;
    }
    return roundedExp;
  }

  // Calculate XP progress to next level
  const totalXpForCurrentLevel = getExpFromLevel(currentLevel);
  const totalXpForNextLevel = getExpFromLevel(currentLevel + 1);
  const xpRequiredForNextLevel = totalXpForNextLevel - totalXpForCurrentLevel;

  // currentXp is the XP progress within the current level (like the XP calculator)
  const currentXpInLevel = currentXp;

  // Calculate progress percentage (clamp between 0 and 100)
  const progressPercentage = Math.min(
    100,
    Math.max(0, (currentXpInLevel / xpRequiredForNextLevel) * 100),
  );

  if (xpRequiredForNextLevel <= 0) {
    return null;
  }

  return (
    <div className="mt-3">
      {/* Game-style Progress Bar - old design without rounded corners */}
      <div
        className={`border-button-info relative h-8 w-full border-2 ${bgStyle === "secondary" ? "bg-secondary-bg" : "bg-primary-bg"}`}
      >
        {/* Progress Fill */}
        <div
          className="bg-button-info absolute top-0 left-0 h-full transition-all duration-500"
          style={
            progressPercentage === 100
              ? { left: 0, right: 0 }
              : { width: `${progressPercentage}%` }
          }
        />

        {/* Mobile Layout - Stack vertically on small screens */}
        <div className="absolute inset-0 flex flex-col justify-center px-2 sm:hidden">
          <div className="text-primary-text text-xs leading-tight font-bold">
            <div className="text-center">LEVEL {currentLevel}</div>
            <div className="text-center text-[10px]">
              SEASON {season?.season || "?"}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Horizontal layout for larger screens */}
        <div className="hidden sm:block">
          {/* XP Text Overlay */}
          <div className="absolute top-1/2 left-2 -translate-y-1/2">
            <span className="text-primary-text text-sm font-bold">
              {currentXpInLevel.toLocaleString()}/
              {xpRequiredForNextLevel.toLocaleString()}
            </span>
          </div>

          {/* Level Info - Centered */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="text-primary-text text-sm font-bold">
              LEVEL {currentLevel}
            </span>
          </div>

          {/* Season Info - Right Side */}
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <span className="text-primary-text text-sm font-bold">
              SEASON {season?.season || "?"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
