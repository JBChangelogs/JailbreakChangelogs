import React from "react";
import SeasonCountdown from "./SeasonCountdown";
import NitroSeasonVideoPlayer from "@/components/Ads/NitroSeasonVideoPlayer";

interface Reward {
  id: number;
  season_number: number;
  item: string;
  requirement: string;
  link: string;
  exclusive: string;
  bonus: string;
}

interface Season {
  season: number;
  title: string;
  start_date: number;
  end_date: number;
  description: string;
  rewards: Reward[];
}

interface SeasonHeaderProps {
  currentSeason: Season | null;
  nextSeason: Season | null;
}

const SeasonHeader: React.FC<SeasonHeaderProps> = ({
  currentSeason,
  nextSeason,
}) => {
  return (
    <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <h2 className="text-primary-text text-2xl font-semibold">
          Roblox Jailbreak Season Archives
        </h2>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-4">
          <p className="text-secondary-text">
            Explore every season of Roblox Jailbreak! Each season brings
            exciting limited-time rewards, exclusive vehicles, and unique
            customization items. Level up, earn XP, and unlock special prizes
            during these time-limited events.
          </p>

          <SeasonCountdown
            currentSeason={currentSeason}
            nextSeason={nextSeason}
          />
        </div>
        <NitroSeasonVideoPlayer className="min-h-[210px] w-full max-w-xs sm:max-w-sm self-center lg:self-start" />
      </div>
    </div>
  );
};

export default SeasonHeader;
