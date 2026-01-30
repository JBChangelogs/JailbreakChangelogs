"use client";

import React from "react";
import { toast } from "sonner";
import { Icon } from "../ui/IconWrapper";
import { Button } from "@/components/ui/button";

interface SeasonNavigationProps {
  seasonList: Array<{ season: number; title: string }>;
  fullSeasonList: Array<{ season: number; title: string; is_current: number }>;
  selectedId: string;
  onSeasonSelect: (id: string) => void;
  onGoToLatestSeason: () => void;
}

const SeasonNavigation: React.FC<SeasonNavigationProps> = ({
  seasonList,
  fullSeasonList,
  selectedId,
  onSeasonSelect,
  onGoToLatestSeason,
}) => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <select
          className="select bg-secondary-bg text-primary-text w-full"
          value={selectedId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onSeasonSelect(e.target.value)
          }
        >
          <option value="" disabled>
            Select a season
          </option>
          {seasonList.map((item) => (
            <option key={item.season} value={item.season.toString()}>
              Season {item.season} - {item.title}
            </option>
          ))}
        </select>

        {seasonList.length > 0 &&
        (() => {
          const currentSeason = fullSeasonList.find(
            (season) => season.is_current === 1,
          );
          return (
            currentSeason && currentSeason.season.toString() !== selectedId
          );
        })() ? (
          <Button onClick={onGoToLatestSeason}>
            <Icon icon="heroicons:clock" className="h-4 w-4" inline={true} />
            <span>Go to Current Season</span>
          </Button>
        ) : (
          <Button
            onClick={() => toast.error("Already on the current season")}
            disabled
          >
            <Icon icon="heroicons:clock" className="h-4 w-4" inline={true} />
            <span>Go to Current Season</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SeasonNavigation;
