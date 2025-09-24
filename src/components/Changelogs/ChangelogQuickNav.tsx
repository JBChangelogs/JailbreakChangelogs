import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";

interface ChangelogQuickNavProps {
  prevChangelog: { id: number; title: string } | null;
  nextChangelog: { id: number; title: string } | null;
  onChangelogSelect: (id: string) => void;
}

const ChangelogQuickNav: React.FC<ChangelogQuickNavProps> = ({
  prevChangelog,
  nextChangelog,
  onChangelogSelect,
}) => {
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row sm:gap-0">
      {prevChangelog && (
        <button
          onClick={() => {
            onChangelogSelect(prevChangelog.id.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-secondary-text group border-link hover:border-link-hover hover:text-link-hover flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-transparent p-4 transition-colors sm:w-auto"
        >
          <ChevronLeftIcon className="text-link group-hover:text-link-hover h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-primary-text text-sm">Previous</span>
            <Tooltip
              title={prevChangelog.title}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <span className="text-link group-hover:text-link-hover line-clamp-1 max-w-[300px] cursor-help text-base font-medium">
                {prevChangelog.title}
              </span>
            </Tooltip>
          </div>
        </button>
      )}

      {nextChangelog && (
        <button
          onClick={() => {
            onChangelogSelect(nextChangelog.id.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-secondary-text group border-link hover:border-link-hover hover:text-link-hover flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-transparent p-4 text-right transition-colors sm:w-auto"
        >
          <div className="flex flex-col items-end">
            <span className="text-primary-text text-sm">Next</span>
            <Tooltip
              title={nextChangelog.title}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <span className="text-link group-hover:text-link-hover line-clamp-1 max-w-[300px] cursor-help text-base font-medium">
                {nextChangelog.title}
              </span>
            </Tooltip>
          </div>
          <ChevronRightIcon className="text-link group-hover:text-link-hover h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default ChangelogQuickNav;
