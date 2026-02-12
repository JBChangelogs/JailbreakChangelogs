"use client";

import React from "react";
import { Icon } from "../ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SeasonNavigationProps {
  seasonList: Array<{ season: number; title: string }>;
  selectedId: string;
  onSeasonSelect: (id: string) => void;
}

const SeasonNavigation: React.FC<SeasonNavigationProps> = ({
  seasonList,
  selectedId,
  onSeasonSelect,
}) => {
  const selectedLabel =
    seasonList.find((item) => item.season.toString() === selectedId)?.title ??
    "";

  return (
    <div className="mb-8 grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
              aria-label="Select a season"
            >
              <span className="truncate">
                {selectedId
                  ? `Season ${selectedId} - ${selectedLabel}`
                  : "Select a season"}
              </span>
              <Icon
                icon="heroicons:chevron-down"
                className="text-secondary-text h-5 w-5"
                inline={true}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
          >
            <DropdownMenuRadioGroup
              value={selectedId}
              onValueChange={onSeasonSelect}
            >
              {seasonList.map((item) => (
                <DropdownMenuRadioItem
                  key={item.season}
                  value={item.season.toString()}
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Season {item.season} - {item.title}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SeasonNavigation;
