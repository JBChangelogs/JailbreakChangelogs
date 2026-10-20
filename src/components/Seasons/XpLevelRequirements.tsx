"use client";

import { getExpFromLevel } from "@/utils/seasonXp";
import { Season } from "@/types/seasons";
import SeasonXpBar from "./SeasonXpBar";
import { Icon } from "@/components/ui/IconWrapper";

interface XpLevelRequirementsProps {
  season: Season;
}

export default function XpLevelRequirements({
  season,
}: XpLevelRequirementsProps) {
  const xpData = season.xp_data;

  const levelRequirements = [];
  for (let i = 2; i <= xpData.targetLevel; i++) {
    const totalXpForLevel = getExpFromLevel(season, i);
    const totalXpForPreviousLevel = getExpFromLevel(season, i - 1);
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
        <div className="bg-icon-tile-bg flex h-10 w-10 items-center justify-center rounded-lg">
          <Icon
            icon="heroicons:bolt"
            className="text-icon-tile h-6 w-6"
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
        {levelRequirements.map((req) => (
          <div key={req.level} className="mb-3">
            <SeasonXpBar
              percent={(req.totalXp / maxTotalXp) * 100}
              xpLabel={`${req.xpRequired.toLocaleString("en-US")}/${req.xpRequired.toLocaleString("en-US")}`}
              level={req.level}
              season={season.season}
              bgStyle="tertiary"
            />
            <div className="text-secondary-text mt-1 flex flex-col gap-1 text-xs sm:flex-row sm:justify-between">
              <span>{`This Level: ${req.xpRequired.toLocaleString("en-US")} XP`}</span>
              <span>{`Total: ${req.totalXp.toLocaleString("en-US")} XP`}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
