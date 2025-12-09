"use client";

import React, { useState } from "react";
import { Changelog } from "@/utils/api";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import {
  getYearStatistics,
  isCurrentYear,
  getCurrentDateString,
} from "@/utils/changelogStats";

interface ChangelogHeaderProps {
  changelogs?: Changelog[];
}

const ChangelogHeader: React.FC<ChangelogHeaderProps> = ({ changelogs }) => {
  const yearStats = changelogs ? getYearStatistics(changelogs) : [];
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  return (
    <div className="bg-secondary-bg border-border-primary mb-8 rounded-lg border p-6">
      <div className="mb-4">
        <h2 className="text-primary-text text-2xl font-semibold">
          Roblox Jailbreak Changelogs & Update History
        </h2>
      </div>
      <p className="text-secondary-text mb-4">
        Welcome to our comprehensive collection of Roblox Jailbreak changelogs!
        Track every update, feature release, and game modification in
        Jailbreak&apos;s history. Some updates and features may be unaccounted
        for, as they may not have been directly announced by Badimo.
      </p>

      {yearStats.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="hover:bg-primary-bg border-border-primary hover:border-border-focus bg-primary-bg flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
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
            <div className="bg-primary-bg border-border-primary mt-2 rounded-lg border p-4">
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
                        recorded {count === 1 ? "update" : "updates"} released
                        in {year}.
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
  );
};

export default ChangelogHeader;
