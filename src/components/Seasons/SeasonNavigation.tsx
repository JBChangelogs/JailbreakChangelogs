"use client";

import React, { useState, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { FaDiceSix } from "react-icons/fa6";
import dynamic from "next/dynamic";

const Select = dynamic(() => import("react-select"), { ssr: false });

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
  const [selectLoaded, setSelectLoaded] = useState(false);

  // Set selectLoaded to true after mount to ensure client-side rendering
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Create options for the select dropdown
  const selectOptions = seasonList.map((item) => ({
    value: item.season.toString(),
    label: `Season ${item.season} - ${item.title}`,
  }));

  // Find the current selected option
  const selectedOption =
    selectOptions.find((option) => option.value === selectedId) || null;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {selectLoaded ? (
          <Select
            value={selectedOption}
            onChange={(option: unknown) => {
              if (!option) {
                onSeasonSelect("");
                return;
              }
              const newValue = (option as { value: string }).value;
              onSeasonSelect(newValue);
            }}
            options={selectOptions}
            placeholder="Select a season"
            className="w-full"
            isClearable={false}
            isSearchable={false}
            unstyled
            classNames={{
              control: () =>
                "text-secondary-text flex items-center justify-between rounded-lg border border-button-info bg-secondary-bg p-3 min-h-[56px] hover:cursor-pointer",
              singleValue: () => "text-secondary-text",
              placeholder: () => "text-secondary-text",
              menu: () =>
                "absolute z-[3000] mt-1 w-full rounded-lg border border-border-primary hover:border-border-focus bg-secondary-bg shadow-lg",
              option: ({ isSelected, isFocused }) =>
                `px-4 py-3 cursor-pointer ${
                  isSelected
                    ? "bg-button-info text-primary-text"
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
            className="text-secondary-text border-button-info bg-secondary-bg flex items-center justify-between rounded-lg border p-3 hover:cursor-pointer focus:outline-none"
          >
            <span>Go to Current Season</span>
            <ClockIcon className="text-button-info h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => toast.error("Already on the current season")}
            className="text-secondary-text border-button-info bg-secondary-bg flex cursor-not-allowed items-center justify-between rounded-lg border p-3 opacity-50 focus:outline-none"
            aria-disabled="true"
          >
            <span>Go to Current Season</span>
            <ClockIcon className="text-button-info h-5 w-5" />
          </button>
        )}

        <button
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * seasonList.length);
            const randomSeason = seasonList[randomIndex];
            onSeasonSelect(randomSeason.season.toString());
            toast.success(`Navigated to random season: ${randomSeason.title}`);
          }}
          className="text-secondary-text border-button-info bg-secondary-bg flex items-center justify-between rounded-lg border p-3 hover:cursor-pointer focus:outline-none"
        >
          <span>Random Season</span>
          <FaDiceSix className="text-button-info h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SeasonNavigation;
