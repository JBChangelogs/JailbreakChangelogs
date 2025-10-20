"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AVAILABLE_CREW_SEASONS } from "@/utils/api";

interface CrewSeasonSelectorProps {
  currentSeason: number;
}

export default function CrewSeasonSelector({
  currentSeason,
}: CrewSeasonSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const season = parseInt(e.target.value);
    const params = new URLSearchParams(searchParams);

    if (season === 19) {
      // Default season, remove the parameter
      params.delete("season");
    } else {
      params.set("season", season.toString());
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "";

    // If we're on a crew detail page, navigate to the main crews page with the season
    if (pathname.startsWith("/crews/") && pathname !== "/crews") {
      router.push(`/crews${newUrl}`);
    } else {
      // Otherwise, stay on the current page
      router.push(`${pathname}${newUrl}`);
    }
  };

  const getSeasonLabel = (season: number) => {
    if (season === 19) return "Current Season";
    return `Season ${season}`;
  };

  const getSeasonDescription = (season: number) => {
    if (season === 19) return "Viewing the current season leaderboard";
    return `Viewing historical data from Season ${season}`;
  };

  return (
    <div className="mb-6">
      <div className="w-full sm:w-64">
        <select
          className="select w-full bg-secondary-bg text-primary-text"
          value={currentSeason}
          onChange={handleSeasonChange}
        >
          <option value="" disabled>
            Select a season
          </option>
          {AVAILABLE_CREW_SEASONS.map((season) => (
            <option key={season} value={season}>
              {getSeasonLabel(season)}
            </option>
          ))}
        </select>
      </div>

      {/* Season Info */}
      <div className="text-secondary-text mt-3 text-sm">
        {getSeasonDescription(currentSeason)}
      </div>
    </div>
  );
}
