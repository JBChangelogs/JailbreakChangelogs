import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icon } from "@/components/ui/IconWrapper";

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
          className="group border-link text-secondary-text hover:border-link-hover hover:text-link-hover flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-transparent p-4 transition-colors sm:w-auto"
        >
          <Icon
            icon="heroicons-outline:chevron-left"
            className="text-link group-hover:text-link-hover h-5 w-5"
          />
          <div className="flex flex-col items-start">
            <span className="text-primary-text text-sm">Previous</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-link group-hover:text-link-hover max-w-[300px] cursor-help truncate text-left text-base font-medium">
                  {prevChangelog.title}
                </span>
              </TooltipTrigger>
              <TooltipContent>{prevChangelog.title}</TooltipContent>
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
          className="group border-link text-secondary-text hover:border-link-hover hover:text-link-hover flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-transparent p-4 text-right transition-colors sm:w-auto"
        >
          <div className="flex flex-col items-end">
            <span className="text-primary-text text-sm">Next</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-link group-hover:text-link-hover max-w-[300px] cursor-help truncate text-right text-base font-medium">
                  {nextChangelog.title}
                </span>
              </TooltipTrigger>
              <TooltipContent>{nextChangelog.title}</TooltipContent>
            </Tooltip>
          </div>
          <Icon
            icon="heroicons-outline:chevron-right"
            className="text-link group-hover:text-link-hover h-5 w-5"
          />
        </button>
      )}
    </div>
  );
};

export default ChangelogQuickNav;
