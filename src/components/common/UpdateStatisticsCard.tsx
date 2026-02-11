"use client";

import React, { useMemo, useState } from "react";
import { Changelog } from "@/utils/api";
import { Icon } from "@/components/ui/IconWrapper";
import {
  getYearStatistics,
  getCurrentDateString,
  isCurrentYear,
} from "@/utils/changelogStats";

interface UpdateStatisticsCardProps {
  changelogs?: Changelog[];
}

const UpdateStatisticsCard: React.FC<UpdateStatisticsCardProps> = ({
  changelogs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const yearStats = useMemo(() => {
    if (!changelogs?.length) {
      return [];
    }

    return getYearStatistics(changelogs);
  }, [changelogs]);

  if (yearStats.length === 0) {
    return null;
  }

  const currentDateString = getCurrentDateString();

  return (
    <div>
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="border-border-card bg-tertiary-bg flex w-full cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
      >
        <h3 className="text-primary-text text-lg font-semibold">
          View Update Statistics
        </h3>
        {isExpanded ? (
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

      {isExpanded && (
        <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-4">
          <div className="text-secondary-text space-y-1 text-sm">
            {yearStats.map(({ year, count }) => (
              <p key={year}>
                {isCurrentYear(year) ? (
                  <>
                    As of {currentDateString}, {year}, there{" "}
                    {count === 1 ? "is" : "are"} a total of{" "}
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
                    recorded {count === 1 ? "update" : "updates"} released in{" "}
                    {year}.
                  </>
                )}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateStatisticsCard;
