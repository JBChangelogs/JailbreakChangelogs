import Link from "next/link";
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
  linkToSeason = false,
  className = "absolute right-2 bottom-2 z-10",
}: {
  season?: number | null;
  level?: number | string | null;
  linkToSeason?: boolean;
  className?: string;
}) {
  const displayedLevel = unlockLevel(level);
  const hasLevel = hasUnlockLevel(displayedLevel);
  if (season == null && !hasLevel) return null;
  const badges = (
    <>
      {season != null && (
        <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
          S{season}
        </span>
      )}
      {hasLevel && (
        <span className="bg-status-success text-button-success-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
          {formatUnlockLevelBadge(displayedLevel)}
        </span>
      )}
    </>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {linkToSeason && season != null && hasLevel ? (
          <Link
            href={`/seasons/${season}`}
            aria-label={`View Season ${season}`}
            className={`${className} flex items-center gap-1`}
          >
            {badges}
          </Link>
        ) : (
          <div className={`${className} flex cursor-help items-center gap-1`}>
            {badges}
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent>
        {formatUnlockRequirementsTooltip(season ?? undefined, displayedLevel)}
      </TooltipContent>
    </Tooltip>
  );
}
