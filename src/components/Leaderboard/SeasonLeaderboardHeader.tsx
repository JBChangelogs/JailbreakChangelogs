"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

interface SeasonHeaderProps {
  latestSeason: {
    season: number;
    title: string;
    end_date: number;
  } | null;
}

export default function SeasonHeader({ latestSeason }: SeasonHeaderProps) {
  const [seasonEnded, setSeasonEnded] = useState(false);

  useEffect(() => {
    if (!latestSeason?.end_date) return;

    // Check immediately on mount
    const checkStatus = () => {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      setSeasonEnded(currentTimestamp >= latestSeason.end_date);
    };

    checkStatus();

    // Check every minute just in case the user stays on the page
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, [latestSeason]);

  const title = latestSeason
    ? `Season ${latestSeason.season} / ${latestSeason.title} ${
        seasonEnded ? "Final Leaderboard" : "Season Leaderboard"
      }`
    : "Season Leaderboard";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">{title}</h1>
      </div>

      {seasonEnded && (
        <div className="bg-button-info/10 border-border-card mb-2 flex w-fit items-center gap-4 rounded-lg border p-4 shadow-sm">
          <Icon icon="line-md:calendar" className="text-primary-text h-6 w-6" />
          <span className="text-primary-text font-bold">
            This season has ended. These are the final rankings.
          </span>
        </div>
      )}
    </div>
  );
}
