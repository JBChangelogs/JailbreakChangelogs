"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Changelog } from "@/utils/api";
import {
  getYearStatistics,
  isCurrentYear,
  getCurrentDateString,
} from "@/utils/changelogStats";

interface TimelineHeaderProps {
  changelogs: Changelog[];
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ changelogs }) => {
  const yearStats = getYearStatistics(changelogs);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  return (
    <div className="border-border-primary bg-secondary-bg mb-8 rounded-lg border p-6">
      <h2 className="text-secondary-text mb-4 text-2xl font-semibold">
        Roblox Jailbreak Timeline
      </h2>
      <p className="text-secondary-text mb-4">
        Explore the complete history of Roblox Jailbreak updates, from the
        game&apos;s launch to the latest changes. Track major updates, feature
        releases, and gameplay evolution chronologically.
      </p>

      {yearStats.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            className="border-border-primary bg-primary-bg hover:border-border-focus hover:bg-primary-bg flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
          >
            <h3 className="text-primary-text text-lg font-semibold">
              View Update Statistics
            </h3>
            {isStatsExpanded ? (
              <Icon
                icon="heroicons-outline:chevron-up"
                className="text-secondary-text h-5 w-5"
                inline={true}
              />
            ) : (
              <Icon
                icon="heroicons-outline:chevron-down"
                className="text-secondary-text h-5 w-5"
                inline={true}
              />
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

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild>
          <Link href="/changelogs">View Changelogs</Link>
        </Button>
      </div>
    </div>
  );
};

export default TimelineHeader;
