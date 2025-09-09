import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#2E3944] pt-4 sm:flex-row sm:gap-0">
      {prevChangelog && (
        <button
          onClick={() => {
            onChangelogSelect(prevChangelog.id.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-muted group flex w-full items-center gap-2 rounded-lg border border-blue-300 bg-transparent p-4 transition-colors hover:border-blue-400 sm:w-auto"
        >
          <ChevronLeftIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-400" />
          <div className="flex flex-col items-start">
            <span className="text-sm text-[#FFFFFF]">Previous</span>
            <span
              className="line-clamp-1 max-w-[300px] text-base font-medium text-blue-300 hover:text-blue-400"
              title={prevChangelog.title}
            >
              {prevChangelog.title}
            </span>
          </div>
        </button>
      )}

      {nextChangelog && (
        <button
          onClick={() => {
            onChangelogSelect(nextChangelog.id.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-muted group flex w-full items-center gap-2 rounded-lg border border-blue-300 bg-transparent p-4 text-right transition-colors hover:border-blue-400 sm:w-auto"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm text-[#FFFFFF]">Next</span>
            <span
              className="line-clamp-1 max-w-[300px] text-base font-medium text-blue-300 hover:text-blue-400"
              title={nextChangelog.title}
            >
              {nextChangelog.title}
            </span>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-blue-300 group-hover:text-blue-400" />
        </button>
      )}
    </div>
  );
};

export default ChangelogQuickNav;
