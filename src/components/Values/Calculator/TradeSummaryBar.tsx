import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../../ui/IconWrapper";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  formatCurrencyValue,
  formatSignedPercent,
  formatSignedValue,
  getTradeVerdict,
  type NumberDisplayMode,
  type TradeVerdict,
} from "./calculatorUtils";
import {
  SIDE_STYLES,
  TINT_FRAME_BY_VERDICT,
  VERDICT_STYLES,
} from "./calculatorStyles";
import { NumberValue } from "./NumberValue";
import { SegmentedControl } from "./SegmentedControl";

interface TradeSummaryBarProps {
  offeringTotal: number;
  requestingTotal: number;
  offeringCount: number;
  requestingCount: number;
  onSwapSides: () => void;
  onClearSides: (event?: React.MouseEvent) => void;
  labels?: { offering: string; requesting: string };
  swapTooltip?: string;
  variant?: "default" | "verdict";
  numberMode?: NumberDisplayMode;
  onNumberModeChange?: (mode: NumberDisplayMode) => void;
  showSwap?: boolean;
}

const DefaultTradeSummaryBar: React.FC<TradeSummaryBarProps> = ({
  offeringTotal,
  requestingTotal,
  offeringCount,
  requestingCount,
  onSwapSides,
  onClearSides,
  labels = { offering: "Offering", requesting: "Requesting" },
  swapTooltip = "Swap offering and requesting sides",
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
            {labels.offering}{" "}
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
          <p className="text-status-error text-xs font-medium tracking-wide uppercase">
            {labels.requesting}{" "}
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
              className="bg-status-error h-full transition-all duration-300"
              style={{ width: `${offeringShare}%` }}
            />
            <div
              className="bg-status-success h-full transition-all duration-300"
              style={{ width: `${requestingShare}%` }}
            />
          </>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={hasItems ? onSwapSides : undefined}
              aria-disabled={!hasItems}
              tabIndex={hasItems ? undefined : -1}
              className={
                !hasItems ? "pointer-events-none opacity-50" : undefined
              }
            >
              <Icon icon="heroicons:arrows-right-left" />
              Swap
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{swapTooltip}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={hasItems ? onClearSides : undefined}
              aria-disabled={!hasItems}
              tabIndex={hasItems ? undefined : -1}
              className={
                !hasItems ? "pointer-events-none opacity-50" : undefined
              }
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

const NUMBER_MODE_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "full", label: "Full" },
] as const;

const describeVerdict = (
  verdict: TradeVerdict,
  mode: NumberDisplayMode,
): { text: string; fullText: string } => {
  if (verdict.kind === "empty") {
    return {
      text: "Add items to compare",
      fullText: "Add items to both sides to compare",
    };
  }
  const percent = verdict.percent ?? 0;
  if (verdict.kind === "fair") {
    return {
      text: "Fair trade",
      fullText: `Fair trade (${formatSignedValue(verdict.difference, "full")}, ${formatSignedPercent(percent)})`,
    };
  }
  const word = verdict.kind === "win" ? "Win" : "Loss";
  return {
    text: `${word} ${formatSignedValue(verdict.difference, mode)} (${formatSignedPercent(percent)})`,
    fullText: `${word} ${formatSignedValue(verdict.difference, "full")} (${formatSignedPercent(percent)})`,
  };
};

const VerdictTradeSummaryBar: React.FC<TradeSummaryBarProps> = ({
  offeringTotal,
  requestingTotal,
  offeringCount,
  requestingCount,
  onSwapSides,
  onClearSides,
  labels = { offering: "Offering", requesting: "Requesting" },
  swapTooltip = "Swap offering and requesting sides",
  numberMode = "short",
  onNumberModeChange,
  showSwap = true,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [showMini, setShowMini] = useState(false);

  useEffect(() => {
    const element = barRef.current;
    if (!element) return;
    const headerHeight =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height",
        ),
      ) || 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMini(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: `-${Math.round(headerHeight)}px 0px 0px 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const hasItems = offeringCount > 0 || requestingCount > 0;
  const verdict = getTradeVerdict(offeringTotal, requestingTotal);
  const { text, fullText } = describeVerdict(verdict, numberMode);
  const verdictStyle = VERDICT_STYLES[verdict.kind];
  const barBackground =
    TINT_FRAME_BY_VERDICT && verdictStyle.frameTint !== ""
      ? verdictStyle.frameTint
      : "bg-secondary-bg";

  const combinedTotal = offeringTotal + requestingTotal;
  const offeringShare =
    combinedTotal > 0 ? (offeringTotal / combinedTotal) * 100 : 50;
  const requestingShare = 100 - offeringShare;

  const totals = [
    {
      side: "offering" as const,
      label: labels.offering,
      count: offeringCount,
      total: offeringTotal,
      align: "text-left",
    },
    {
      side: "requesting" as const,
      label: labels.requesting,
      count: requestingCount,
      total: requestingTotal,
      align: "text-right",
    },
  ];

  return (
    <>
      <div
        className="sticky z-30 m-0! h-0"
        style={{ top: "calc(var(--header-height, 0px) + 8px)" }}
        aria-hidden="true"
      >
        <div
          className={`bg-secondary-bg absolute inset-x-0 top-0 flex items-center justify-between gap-3 rounded-lg border-2 px-3 py-2 shadow-lg transition-[opacity,transform,border-color] duration-200 motion-reduce:transition-none ${verdictStyle.frame} ${
            showMini
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-bold tabular-nums ${verdictStyle.pill}`}
          >
            <Icon icon={verdictStyle.icon} className="h-4 w-4" />
            {text}
          </span>
          <span className="text-primary-text flex min-w-0 items-center gap-2 text-sm font-semibold tabular-nums">
            <span className="truncate">
              <span className="text-secondary-text font-medium">
                {SIDE_STYLES.offering.shortLabel}{" "}
              </span>
              <NumberValue value={offeringTotal} mode={numberMode} />
            </span>
            <span className="text-secondary-text">→</span>
            <span className="truncate">
              <span className="text-secondary-text font-medium">
                {SIDE_STYLES.requesting.shortLabel}{" "}
              </span>
              <NumberValue value={requestingTotal} mode={numberMode} />
            </span>
          </span>
        </div>
      </div>
      <div
        ref={barRef}
        className={`rounded-lg border-2 p-3 shadow-lg transition-colors duration-300 motion-reduce:transition-none sm:p-4 ${verdictStyle.frame} ${barBackground}`}
      >
        <div
          className="flex justify-center"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`inline-flex max-w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-center text-sm leading-tight font-bold tabular-nums shadow-sm ${verdictStyle.pill}`}
                title={fullText}
              >
                <Icon
                  icon={verdictStyle.icon}
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{text}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="tabular-nums">{fullText}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {totals.map(({ side, label, count, total, align }) => {
            const style = SIDE_STYLES[side];
            return (
              <div key={side} className={`min-w-0 ${align}`}>
                <p
                  className={`text-secondary-text flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase ${
                    side === "requesting" ? "justify-end" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.iconChip}`}
                  >
                    <Icon
                      icon={style.icon}
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="truncate">{label}</span>
                  <span className="shrink-0 normal-case">({count})</span>
                </p>
                <p className="text-primary-text truncate text-lg font-bold sm:text-2xl">
                  <NumberValue value={total} mode={numberMode} />
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-tertiary-bg mt-3 flex h-1.5 w-full overflow-hidden rounded-full">
          {hasItems ? (
            <>
              <div
                className="bg-status-error h-full transition-all duration-300"
                style={{ width: `${offeringShare}%` }}
              />
              <div
                className="bg-status-success h-full transition-all duration-300"
                style={{ width: `${requestingShare}%` }}
              />
            </>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {onNumberModeChange && (
            <SegmentedControl
              options={NUMBER_MODE_OPTIONS}
              value={numberMode}
              onChange={onNumberModeChange}
              ariaLabel="Number display"
              size="md"
            />
          )}
          {showSwap && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSwapSides}
                  disabled={!hasItems}
                  className="pointer-coarse:h-10!"
                >
                  <Icon icon="heroicons:arrows-right-left" />
                  Swap
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{swapTooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearSides}
                disabled={!hasItems}
                className="pointer-coarse:h-10!"
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
    </>
  );
};

export const TradeSummaryBar: React.FC<TradeSummaryBarProps> = (props) =>
  props.variant === "verdict" ? (
    <VerdictTradeSummaryBar {...props} />
  ) : (
    <DefaultTradeSummaryBar {...props} />
  );
