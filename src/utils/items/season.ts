export function hasSeason(
  item:
    | { season?: number | null; data?: { season?: number | null } }
    | null
    | undefined,
): boolean {
  return item?.season != null || item?.data?.season != null;
}

export function unlockLevel(
  level: number | string | null | undefined,
): string | undefined {
  if (level == null || level === "") return undefined;
  return String(level);
}

export function isSeasonalItem(
  item:
    | {
        season?: number | null;
        level?: number | string | null;
        data?: { season?: number | null; level?: number | string | null };
      }
    | null
    | undefined,
): boolean {
  return hasSeason(item) || item?.level != null || item?.data?.level != null;
}
