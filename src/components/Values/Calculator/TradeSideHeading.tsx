import { Icon } from "@/components/ui/IconWrapper";
import { formatCurrencyValue } from "./calculatorUtils";

export function TradeSideHeading({
  side,
  count,
  total,
}: {
  side: "offering" | "requesting";
  count: number;
  total: number;
}) {
  const isGiving = side === "offering";
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isGiving ? "bg-button-info text-form-button-text" : "bg-button-secondary text-primary-text"}`}
        aria-hidden="true"
      >
        <Icon
          icon="material-symbols:arrow-forward-rounded"
          className={`h-5 w-5 ${isGiving ? "-rotate-45" : "rotate-135"}`}
        />
      </span>
      <h3 className="text-primary-text text-xs font-semibold tracking-wide uppercase">
        {isGiving ? "You give" : "You receive"}
      </h3>
      <span className="text-secondary-text text-xs">
        · {count} {count === 1 ? "item" : "items"}
      </span>
      <span className="text-primary-text text-sm font-bold tabular-nums">
        {formatCurrencyValue(total)}
      </span>
    </div>
  );
}
