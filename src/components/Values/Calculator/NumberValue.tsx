import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import {
  formatByMode,
  formatCurrencyValue,
  type NumberDisplayMode,
} from "./calculatorUtils";

interface NumberValueProps {
  value: number;
  mode: NumberDisplayMode;
  className?: string;
}

export const NumberValue: React.FC<NumberValueProps> = ({
  value,
  mode,
  className = "",
}) => {
  const shown = formatByMode(value, mode);
  const full = formatCurrencyValue(value);
  const classes = `tabular-nums ${className}`;

  if (shown === full) {
    return <span className={classes}>{shown}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={classes} title={full}>
          {shown}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="tabular-nums">{full}</p>
      </TooltipContent>
    </Tooltip>
  );
};
