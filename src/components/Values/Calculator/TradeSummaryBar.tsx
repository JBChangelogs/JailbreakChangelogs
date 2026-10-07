import React from "react";
import { Icon } from "../../ui/IconWrapper";
import { formatCurrencyValue } from "./calculatorUtils";

interface TradeSummaryBarProps {
  offeringTotal: number;
  requestingTotal: number;
  offeringCount: number;
  requestingCount: number;
  offeringLabel?: string;
  requestingLabel?: string;
}

export const TradeSummaryBar: React.FC<TradeSummaryBarProps> = ({
  offeringTotal,
  requestingTotal,
  offeringCount,
  requestingCount,
  offeringLabel = "Offering",
  requestingLabel = "Requesting",
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
      ? "border-border-card bg-tertiary-bg text-primary-text"
      : difference > 0
        ? "border-status-error bg-status-error text-form-button-text"
        : "border-status-success bg-status-success text-form-button-text";

  const netBadgeClass = `inline-flex max-w-full items-center justify-center rounded-lg border px-3 py-1.5 text-center text-sm leading-tight font-bold tabular-nums shadow-sm ${netColorClass}`;

  return (
    <div className="border-border-card bg-secondary-bg/95 rounded-lg border p-4 shadow-lg backdrop-blur-xl">
      {/* Keep the larger badge above the totals until there is room between them. */}
      <div className="mb-3 flex justify-center lg:hidden">
        <span className={netBadgeClass}>{netLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-status-success text-xs font-medium tracking-wide uppercase">
            {offeringLabel}{" "}
            <span className="text-secondary-text normal-case">
              ({offeringCount})
            </span>
          </p>
          <p className="text-primary-text truncate text-xl font-bold sm:text-2xl">
            {formatCurrencyValue(offeringTotal)}
          </p>
        </div>

        <div className="hidden shrink-0 flex-col items-center gap-1 lg:flex">
          <Icon
            icon="heroicons:scale"
            className="text-secondary-text/60 h-5 w-5"
            inline={true}
          />
          <span className={netBadgeClass}>{netLabel}</span>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <p className="text-button-danger text-xs font-medium tracking-wide uppercase">
            {requestingLabel}{" "}
            <span className="text-secondary-text normal-case">
              ({requestingCount})
            </span>
          </p>
          <p className="text-primary-text truncate text-xl font-bold sm:text-2xl">
            {formatCurrencyValue(requestingTotal)}
          </p>
        </div>
      </div>

      {/* Proportion bar: colored by favorability (same framing as netLabel
          above), not by side — a larger offering share means you're giving
          away more, so it's red; a larger requesting share means you're
          getting more, so it's green. */}
      <div className="bg-tertiary-bg mt-3 flex h-1.5 w-full overflow-hidden rounded-full">
        {hasItems ? (
          <>
            <div
              className="bg-button-danger h-full transition-all duration-300"
              style={{ width: `${offeringShare}%` }}
            />
            <div
              className="bg-status-success h-full transition-all duration-300"
              style={{ width: `${requestingShare}%` }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};
