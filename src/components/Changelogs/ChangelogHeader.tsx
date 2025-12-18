"use client";

import React, { useState } from "react";
import { Changelog } from "@/utils/api";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  getYearStatistics,
  isCurrentYear,
  getCurrentDateString,
} from "@/utils/changelogStats";
import NitroChangelogVideoPlayer from "@/components/Ads/NitroChangelogVideoPlayer";

interface ChangelogHeaderProps {
  changelogs?: Changelog[];
}

const ChangelogHeader: React.FC<ChangelogHeaderProps> = ({ changelogs }) => {
  const yearStats = changelogs ? getYearStatistics(changelogs) : [];
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  return (
    <div className="border-border-primary bg-secondary-bg mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <h2 className="text-primary-text text-2xl font-semibold">
          Roblox Jailbreak Changelogs & Update History
        </h2>
      </div>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-4">
          <p className="text-secondary-text">
            Welcome to our comprehensive collection of Roblox Jailbreak
            changelogs! Track every update, feature release, and game
            modification in Jailbreak&apos;s history. Some updates and features
            may be unaccounted for, as they may not have been directly announced
            by Badimo.
          </p>

          {yearStats.length > 0 && (
            <div>
              <button
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                className="border-border-primary bg-primary-bg hover:border-border-focus hover:bg-primary-bg flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
              >
                <h3 className="text-primary-text text-lg font-semibold">
                  View Update Statistics
                </h3>
                {isStatsExpanded ? (
                  <ChevronUpIcon className="text-secondary-text h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="text-secondary-text h-5 w-5" />
                )}
              </button>

              {isStatsExpanded && (
                <div className="border-border-primary bg-primary-bg mt-2 rounded-lg border p-4">
                  <div className="text-secondary-text space-y-1 text-sm">
                    {yearStats.map(({ year, count }) => (
                      <p key={year}>
                        {isCurrentYear(year) ? (
                          <>
                            As of {getCurrentDateString()}, {year}, there are a
                            total of{" "}
                            <span className="text-primary-text font-semibold">
                              {count}
                            </span>{" "}
                            {count === 1 ? "update" : "updates"} in {year}.
                          </>
                        ) : (
                          <>
                            There were a total of{" "}
                            <span className="text-primary-text font-semibold">
                              {count}
                            </span>{" "}
                            recorded {count === 1 ? "update" : "updates"}
                            released in {year}.
                          </>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <NitroChangelogVideoPlayer className="min-h-[210px] w-full max-w-xs self-center sm:max-w-sm lg:self-start" />
      </div>
    </div>
  );
};

export default ChangelogHeader;
