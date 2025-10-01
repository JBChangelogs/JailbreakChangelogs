"use client";

import { Season } from "@/types/seasons";

interface XpLevelProgressBarProps {
  level: number;
  totalXpForLevel: number;
  maxTotalXp: number;
  season: Season;
  isTarget?: boolean;
}

export default function XpLevelProgressBar({
  level,
  totalXpForLevel,
  maxTotalXp,
  season,
}: XpLevelProgressBarProps) {
  // Calculate progress percentage relative to max total XP.
  const progressPercentage = (totalXpForLevel / maxTotalXp) * 100;

  // Calculate XP required for this level (from previous level to this level)
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

  // Calculate XP required for this level only
  const totalXpForPreviousLevel = level > 1 ? getExpFromLevel(level - 1) : 0;
  const xpRequiredForThisLevel = totalXpForLevel - totalXpForPreviousLevel;

  return (
    <div className="mb-3">
      {/* Game-style Progress Bar */}
      <div className="border-button-info relative w-full rounded-lg border-2 p-[2px]">
        <div className="bg-primary-bg relative h-8 w-full overflow-hidden rounded-md">
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
              <div className="text-center">LEVEL {level}</div>
              <div className="text-center text-[10px]">
                SEASON {season.season}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Horizontal layout for larger screens */}
          <div className="hidden sm:block">
            {/* XP Text Overlay */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2">
              <span className="text-primary-text text-sm font-bold">
                {xpRequiredForThisLevel.toLocaleString()}/
                {xpRequiredForThisLevel.toLocaleString()}
              </span>
            </div>

            {/* Level Info - Centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="text-primary-text text-sm font-bold">
                LEVEL {level}
              </span>
            </div>

            {/* Season Info - Right Side */}
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <span className="text-primary-text text-sm font-bold">
                SEASON {season.season}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="text-secondary-text mt-1 flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
        <span>This Level: {xpRequiredForThisLevel.toLocaleString()} XP</span>
        <span>Total: {totalXpForLevel.toLocaleString()} XP</span>
      </div>
    </div>
  );
}
