"use client";

import React from "react";
import { toast } from "react-hot-toast";
import { Icon } from "../UI/IconWrapper";

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
          className="select w-full bg-secondary-bg text-primary-text"
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
          <button
            onClick={onGoToLatestSeason}
            className="bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-2 rounded px-4 py-2 transition-colors"
          >
            <span>Go to Current Season</span>
            <Icon icon="heroicons:clock" className="h-4 w-4" inline={true} />
          </button>
        ) : (
          <button
            onClick={() => toast.error("Already on the current season")}
            className="bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-not-allowed items-center gap-2 rounded px-4 py-2 transition-colors opacity-50"
            aria-disabled="true"
          >
            <span>Go to Current Season</span>
            <Icon icon="heroicons:clock" className="h-4 w-4" inline={true} />
          </button>
        )}

        <button
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * seasonList.length);
            const randomSeason = seasonList[randomIndex];
            onSeasonSelect(randomSeason.season.toString());
            toast.success(`Navigated to random season: ${randomSeason.title}`);
          }}
          className="bg-button-info text-form-button-text hover:bg-button-info-hover flex cursor-pointer items-center gap-2 rounded px-4 py-2 transition-colors"
        >
          <span>Random Season</span>
          <Icon
            icon="streamline-ultimate:dice-bold"
            className="h-4 w-4"
            inline={true}
          />
        </button>
      </div>
    </div>
  );
};

export default SeasonNavigation;
