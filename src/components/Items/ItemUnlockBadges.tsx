import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { unlockLevel } from "@/utils/items/season";
import {
  formatUnlockLevelBadge,
  formatUnlockRequirementsTooltip,
  hasUnlockLevel,
} from "@/utils/items/itemUnlockPresentation";

export function ItemUnlockBadges({
  season,
  level,
}: {
  season?: number | null;
  level?: number | string | null;
}) {
  const displayedLevel = unlockLevel(level);
  const hasLevel = hasUnlockLevel(displayedLevel);
  if (season == null && !hasLevel) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="absolute right-2 bottom-2 z-10 flex cursor-help items-center gap-1">
          {season != null && (
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
              S{season}
            </span>
          )}
          {hasLevel && (
            <span className="bg-status-success text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
              {formatUnlockLevelBadge(displayedLevel)}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {formatUnlockRequirementsTooltip(season ?? undefined, displayedLevel)}
      </TooltipContent>
    </Tooltip>
  );
}
