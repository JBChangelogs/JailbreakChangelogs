import React from 'react';
import { ClockIcon } from "@heroicons/react/24/outline";
import { toast } from 'react-hot-toast';
import { FaDiceSix } from "react-icons/fa6";

interface SeasonNavigationProps {
  seasonList: Array<{ season: number; title: string }>;
  selectedId: string;
  onSeasonSelect: (id: string) => void;
  onGoToLatestSeason: () => void;
}

const SeasonNavigation: React.FC<SeasonNavigationProps> = ({
  seasonList,
  selectedId,
  onSeasonSelect,
  onGoToLatestSeason,
}) => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <select
          value={selectedId}
          onChange={(e) => onSeasonSelect(e.target.value)}
          className="rounded-lg border border-[#2E3944] bg-[#212A31] p-3 text-muted focus:border-[#5865F2] focus:outline-none"
        >
          <option value="" disabled className="text-muted">
            Select a season
          </option>
          {seasonList.map((item) => (
            <option key={item.season} value={item.season} className="text-muted">
              Season {item.season} - {item.title}
            </option>
          ))}
        </select>

        {seasonList.length > 0 && seasonList[0].season.toString() !== selectedId ? (
          <button
            onClick={onGoToLatestSeason}
            className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] p-3 text-muted hover:bg-[#32365A] focus:outline-none flex items-center justify-between"
          >
            <span>Go to Latest Season</span>
            <ClockIcon className="h-5 w-5 text-[#5865F2]" />
          </button>
        ) : (
          <button
            onClick={() => toast.error('Already on the latest season')}
            className="rounded-lg border border-[#5865F2] bg-[#2B2F4C] p-3 text-muted hover:bg-[#32365A] focus:outline-none flex items-center justify-between opacity-50 cursor-not-allowed"
            aria-disabled="true"
          >
            <span>Go to Latest Season</span>
            <ClockIcon className="h-5 w-5 text-[#5865F2]" />
          </button>
        )}

        <button
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * seasonList.length);
            const randomSeason = seasonList[randomIndex];
            onSeasonSelect(randomSeason.season.toString());
            toast.success(`Navigated to random season: ${randomSeason.title}`);
          }}
          className="rounded-lg border border-[#FAA61A] bg-[#3A2F1E] p-3 text-muted hover:bg-[#4A3A23] focus:outline-none flex items-center justify-between"
        >
          <span>Random Season</span>
          <FaDiceSix className="w-5 h-5 text-[#FAA61A]" />
        </button>
      </div>
    </div>
  );
};

export default SeasonNavigation; 