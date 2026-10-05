import React from "react";
import { Button } from "../../ui/button";
import { Icon } from "../../ui/IconWrapper";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  formatSignedPercent,
  formatSignedValue,
  type NumberDisplayMode,
  type TradeVerdict,
} from "./calculatorUtils";
import { VERDICT_STYLES } from "./calculatorStyles";

interface TradeConnectorProps {
  verdict: TradeVerdict;
  numberMode: NumberDisplayMode;
  onSwapSides: () => void;
  hasItems: boolean;
}

export const TradeConnector: React.FC<TradeConnectorProps> = ({
  verdict,
  numberMode,
  onSwapSides,
  hasItems,
}) => {
  const style = VERDICT_STYLES[verdict.kind];
  const showDifference =
    verdict.kind !== "empty" && verdict.percent !== null && hasItems;

  return (
    <div className="flex items-center gap-3" data-component="trade-connector">
      <div className="bg-border-card h-px flex-1" aria-hidden="true" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={onSwapSides}
            disabled={!hasItems}
            aria-label="Swap You give and You receive"
            className="pointer-coarse:h-10!"
          >
            <Icon icon="heroicons:arrows-up-down" aria-hidden="true" />
            Swap
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Swap You give and You receive</p>
        </TooltipContent>
      </Tooltip>
      {showDifference && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tabular-nums ${style.pill}`}
        >
          <Icon icon={style.icon} className="h-4 w-4" aria-hidden="true" />
          {formatSignedValue(verdict.difference, numberMode)} (
          {formatSignedPercent(verdict.percent ?? 0)})
        </span>
      )}
      <div className="bg-border-card h-px flex-1" aria-hidden="true" />
    </div>
  );
};
