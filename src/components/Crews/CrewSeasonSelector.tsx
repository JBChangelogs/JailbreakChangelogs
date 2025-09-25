"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AVAILABLE_CREW_SEASONS } from "@/utils/api";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

interface CrewSeasonSelectorProps {
  currentSeason: number;
}

export default function CrewSeasonSelector({
  currentSeason,
}: CrewSeasonSelectorProps) {
  const [selectLoaded, setSelectLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  const handleSeasonChange = (option: unknown) => {
    if (!option) {
      // Reset to current season (19)
      const params = new URLSearchParams(searchParams);
      params.delete("season");
      const newUrl = params.toString() ? `?${params.toString()}` : "";

      if (pathname.startsWith("/crews/") && pathname !== "/crews") {
        router.push(`/crews${newUrl}`);
      } else {
        router.push(`${pathname}${newUrl}`);
      }
      return;
    }

    const season = (option as { value: number }).value;
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
        {selectLoaded ? (
          <Select
            value={{
              value: currentSeason,
              label: getSeasonLabel(currentSeason),
            }}
            onChange={handleSeasonChange}
            options={AVAILABLE_CREW_SEASONS.map((season) => ({
              value: season,
              label: getSeasonLabel(season),
            }))}
            classNamePrefix="react-select"
            className="w-full"
            isClearable={false}
            isSearchable={false}
            unstyled
            classNames={{
              control: () =>
                "text-secondary-text flex items-center justify-between rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg p-3 min-h-[56px] hover:cursor-pointer hover:bg-primary-bg focus-within:border-button-info",
              singleValue: () => "text-secondary-text",
              placeholder: () => "text-secondary-text",
              menu: () =>
                "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
              option: ({ isSelected, isFocused }) =>
                `px-4 py-3 cursor-pointer ${
                  isSelected
                    ? "bg-button-info text-form-button-text"
                    : isFocused
                      ? "bg-quaternary-bg text-primary-text"
                      : "bg-secondary-bg text-secondary-text"
                }`,
              clearIndicator: () =>
                "text-secondary-text hover:text-primary-text cursor-pointer",
              dropdownIndicator: () =>
                "text-secondary-text hover:text-primary-text cursor-pointer",
            }}
          />
        ) : (
          <div className="border-border-primary hover:border-border-focus bg-secondary-bg h-12 w-full animate-pulse rounded-lg border"></div>
        )}
      </div>

      {/* Season Info */}
      <div className="text-secondary-text mt-3 text-sm">
        {getSeasonDescription(currentSeason)}
      </div>
    </div>
  );
}
