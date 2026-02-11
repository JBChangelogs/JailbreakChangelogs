"use client";

import { Season } from "@/types/seasons";
import XpLevelProgressBar from "./XpLevelProgressBar";
import { Icon } from "@/components/ui/IconWrapper";

interface XpLevelRequirementsProps {
  season: Season;
}

export default function XpLevelRequirements({
  season,
}: XpLevelRequirementsProps) {
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

  const levelRequirements = [];
  for (let i = 2; i <= xpData.targetLevel; i++) {
    const totalXpForLevel = getExpFromLevel(i);
    const totalXpForPreviousLevel = getExpFromLevel(i - 1);
    const xpRequiredForLevel = totalXpForLevel - totalXpForPreviousLevel;

    levelRequirements.push({
      level: i,
      totalXp: totalXpForLevel,
      xpRequired: xpRequiredForLevel,
    });
  }

  const maxTotalXp = levelRequirements[levelRequirements.length - 1].totalXp;

  return (
    <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-button-info/10 flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon
            icon="heroicons:bolt"
            className="text-link h-6 w-6"
            inline={true}
          />
        </div>
        <div>
          <h2 className="text-primary-text text-2xl font-bold">
            XP Requirements by Level
          </h2>
          <p className="text-secondary-text">
            Season {season.season} progression guide
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {levelRequirements.map((req) => {
          const isTarget = req.level === xpData.targetLevel;

          return (
            <XpLevelProgressBar
              key={req.level}
              level={req.level}
              totalXpForLevel={req.totalXp}
              maxTotalXp={maxTotalXp}
              season={season}
              isTarget={isTarget}
            />
          );
        })}
      </div>
    </div>
  );
}
