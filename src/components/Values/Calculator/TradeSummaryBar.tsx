import React from "react";
import { Icon } from "../../ui/IconWrapper";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { formatCurrencyValue } from "./calculatorUtils";

interface TradeSummaryBarProps {
  offeringTotal: number;
  requestingTotal: number;
  offeringCount: number;
  requestingCount: number;
  onSwapSides: () => void;
  onClearSides: (event?: React.MouseEvent) => void;
}

export const TradeSummaryBar: React.FC<TradeSummaryBarProps> = ({
  offeringTotal,
  requestingTotal,
  offeringCount,
  requestingCount,
  onSwapSides,
  onClearSides,
}) => {
  const hasItems = offeringCount > 0 || requestingCount > 0;
  const difference = offeringTotal - requestingTotal;
  const combinedTotal = offeringTotal + requestingTotal;
  const offeringShare =
    combinedTotal > 0 ? (offeringTotal / combinedTotal) * 100 : 50;
  const requestingShare = 100 - offeringShare;

  // Framed from the trader's own perspective: giving away more value than you
  // receive is the unfavorable outcome (red), receiving more than you give is
  // favorable (green) — not simply "whichever side has the bigger number".
  const netLabel =
    difference === 0
      ? "Even trade"
      : difference > 0
        ? `You're giving ${formatCurrencyValue(Math.abs(difference))} more`
        : `You're getting ${formatCurrencyValue(Math.abs(difference))} more`;

  const netColorClass =
    difference === 0
      ? "border-border-card bg-tertiary-bg text-secondary-text"
      : difference > 0
        ? "border-status-error/40 bg-status-error/80 text-form-button-text"
        : "border-status-success/40 bg-status-success/80 text-form-button-text";

  return (
    <div
      className="border-border-card bg-secondary-bg/95 sticky z-30 rounded-lg border p-4 shadow-lg backdrop-blur-xl"
      style={{ top: "calc(var(--header-height, 0px) + 12px)" }}
    >
      {/* Mobile: net badge sits above the row instead of squeezing between the
          two value columns, which was truncating the totals on narrow screens. */}
      <div className="mb-3 flex justify-center sm:hidden">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-center text-[11px] leading-none font-semibold whitespace-nowrap ${netColorClass}`}
        >
          {netLabel}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-status-success text-xs font-medium tracking-wide uppercase">
            Offering{" "}
            <span className="text-secondary-text normal-case">
              ({offeringCount})
            </span>
          </p>
          <p className="text-primary-text truncate text-xl font-bold sm:text-2xl">
            {formatCurrencyValue(offeringTotal)}
          </p>
        </div>

        <div className="hidden shrink-0 flex-col items-center gap-1 sm:flex">
          <Icon
            icon="heroicons:scale"
            className="text-secondary-text/60 h-5 w-5"
            inline={true}
          />
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-center text-xs leading-none font-semibold whitespace-nowrap ${netColorClass}`}
          >
            {netLabel}
          </span>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <p className="text-status-error text-xs font-medium tracking-wide uppercase">
            Requesting{" "}
            <span className="text-secondary-text normal-case">
              ({requestingCount})
            </span>
          </p>
          <p className="text-primary-text truncate text-xl font-bold sm:text-2xl">
            {formatCurrencyValue(requestingTotal)}
          </p>
        </div>
      </div>

      {/* Proportion bar */}
      <div className="bg-tertiary-bg mt-3 flex h-1.5 w-full overflow-hidden rounded-full">
        {hasItems ? (
          <>
            <div
              className="bg-status-success h-full transition-all duration-300"
              style={{ width: `${offeringShare}%` }}
            />
            <div
              className="bg-status-error h-full transition-all duration-300"
              style={{ width: `${requestingShare}%` }}
            />
          </>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={onSwapSides}
              disabled={!hasItems}
            >
              <Icon icon="heroicons:arrows-right-left" />
              Swap
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Swap offering and requesting sides</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClearSides}
              disabled={!hasItems}
            >
              <Icon icon="heroicons-outline:trash" />
              Clear
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Clear items (hold Shift to clear both sides instantly)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
