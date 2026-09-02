import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CategoryProgressBarEntry {
  key: string;
  label: string;
  widthPercent: number;
  color: string;
  tooltip: ReactNode;
}

interface CategoryProgressBarProps {
  entries: CategoryProgressBarEntry[];
  emptyMessage: string;
  className?: string;
}

export default function CategoryProgressBar({
  entries,
  emptyMessage,
  className,
}: CategoryProgressBarProps) {
  return (
    <div
      className={`bg-tertiary-bg flex h-8 w-full overflow-hidden rounded-lg${className ? ` ${className}` : ""}`}
    >
      {entries.length > 0 ? (
        entries.map((entry) => (
          <Tooltip key={entry.key}>
            <TooltipTrigger asChild>
              <div
                className="group relative"
                style={{
                  width: `${entry.widthPercent}%`,
                  backgroundColor: entry.color,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">{entry.tooltip}</TooltipContent>
          </Tooltip>
        ))
      ) : (
        <div className="bg-tertiary-bg flex h-full w-full items-center justify-center">
          <span className="text-secondary-text text-xs">{emptyMessage}</span>
        </div>
      )}
    </div>
  );
}
