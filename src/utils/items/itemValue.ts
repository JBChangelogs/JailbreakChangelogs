// Older items store "N/A" for unknown fields; newer ones use null.
export function hasItemValue(
  value: string | null | undefined,
): value is string {
  if (value == null) return false;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "N/A" && trimmed !== "null";
}
