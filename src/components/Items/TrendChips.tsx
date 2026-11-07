import { getTrendColor } from "@/utils/items/badgeColors";
import { formatFullValue } from "@/utils/trading/values";
import { cn } from "@/lib/utils";

// One colored chip per trend; a single "Unknown" chip when the list is empty.
export function TrendChips({
  trends,
  chipClassName,
  className,
}: {
  trends: string[];
  chipClassName: string;
  className?: string;
}) {
  const shown = trends.length > 0 ? trends : [null];
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {shown.map((trend) => (
        <span
          key={trend ?? "unknown"}
          className={cn(getTrendColor(trend), chipClassName)}
          title={trend ?? "Unknown"}
        >
          {trend ?? "Unknown"}
        </span>
      ))}
    </span>
  );
}

// Suggestion/changelog values are lists for `trends` suggestions.
export type SuggestionFieldValue = string | string[] | null;

export const suggestionValueText = (value: SuggestionFieldValue | undefined) =>
  Array.isArray(value) ? value.join(", ") || "N/A" : formatFullValue(value);

export function SuggestionValue({
  value,
  format = formatFullValue,
}: {
  value: SuggestionFieldValue | undefined;
  format?: (value: string) => string;
}) {
  if (Array.isArray(value)) return <>{value.join(", ") || "N/A"}</>;
  return <>{format(value || "N/A")}</>;
}
