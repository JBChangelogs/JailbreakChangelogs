// Older items store "N/A" for unknown fields; newer ones use null.
export function hasItemValue(
  value: string | null | undefined,
): value is string {
  if (value == null) return false;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "N/A" && trimmed !== "null";
}

export type TrendFields = {
  trend?: string | null;
  trends?: string[] | null;
};

// `trends` is the full list (first entry === `trend`); fall back to `trend`
// for payloads that predate it.
export function itemTrends(item: TrendFields): string[] {
  return item.trends ?? (hasItemValue(item.trend) ? [item.trend] : []);
}
