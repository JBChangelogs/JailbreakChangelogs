import type { CSSProperties } from "react";
import { getDemandCssColor, getTrendCssColor } from "@/utils/items/badgeColors";

// Color-coded toggle chip for a Demand/Trend filter, using the same badge
// colors as item cards and the trading guide.
export function AdvancedFilterChip({
  group,
  label,
  selected,
  onToggle,
}: {
  group: string;
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const color =
    group === "Trend" ? getTrendCssColor(label) : getDemandCssColor(label);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`text-primary-text focus-visible:outline-border-focus inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        selected
          ? "bg-(--chip-bg) ring-1"
          : "border-border-card bg-tertiary-bg hover:bg-(--chip-hover)"
      }`}
      style={
        {
          borderColor: selected ? color : undefined,
          "--tw-ring-color": color,
          "--chip-bg": `color-mix(in srgb, ${color} 25%, transparent)`,
          "--chip-hover": `color-mix(in srgb, ${color} 10%, transparent)`,
        } as CSSProperties
      }
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  );
}
