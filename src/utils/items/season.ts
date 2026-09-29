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
