export function hasUnlockLevel(level?: string): level is string {
  return typeof level === "string" && level.length > 0;
}

export function isTopPercentUnlockLevel(level: string): boolean {
  return level.includes("%");
}

export function formatUnlockLevelTooltipLabel(level: string): string {
  return isTopPercentUnlockLevel(level) ? `Top ${level}` : `Level ${level}`;
}

export function formatUnlockLevelBadge(level: string): string {
  return isTopPercentUnlockLevel(level) ? level : `L${level}`;
}

export function formatUnlockRequirementsTooltip(
  season?: number,
  level?: string,
): string {
  const hasSeason = typeof season === "number";
  const hasLevel = hasUnlockLevel(level);

  if (hasSeason && hasLevel) {
    return `Unlocked in Season ${season} at ${formatUnlockLevelTooltipLabel(level)}.`;
  }

  if (hasSeason) {
    return `Unlocked in Season ${season}.`;
  }

  if (hasLevel) {
    return `Unlocked at ${formatUnlockLevelTooltipLabel(level)}.`;
  }

  return "";
}
