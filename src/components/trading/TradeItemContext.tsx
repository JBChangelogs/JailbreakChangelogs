import React from "react";
import { TradeItem } from "@/types/trading";
import { Icon } from "@/components/ui/IconWrapper";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import { hasItemValue } from "@/utils/items/itemValue";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NoteButton = ({
  name,
  ...buttonProps
}: { name: string } & React.ComponentProps<"button">) => (
  <button
    {...buttonProps}
    type="button"
    className="border-border-card bg-secondary-bg text-secondary-text hover:text-primary-text inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border [@media(hover:hover)]:h-6 [@media(hover:hover)]:w-6"
    aria-label={`Read note for ${name}`}
  >
    <Icon icon="mdi:information-outline" className="h-3.5 w-3.5" />
  </button>
);

export const TradeItemNote = ({
  item,
  name = item.name,
}: {
  item: TradeItem;
  name?: string;
}) => {
  const notes = item.notes ?? item.data?.notes;
  if (!hasItemValue(notes)) return null;

  return (
    <>
      <span className="hidden [@media(hover:hover)]:inline-flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <NoteButton name={name} />
          </TooltipTrigger>
          <TooltipContent className="max-h-64 max-w-72 overflow-y-auto whitespace-pre-wrap">
            {notes}
          </TooltipContent>
        </Tooltip>
      </span>
      <span className="inline-flex [@media(hover:hover)]:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <NoteButton name={name} />
          </PopoverTrigger>
          <PopoverContent className="max-h-64 w-64 overflow-y-auto p-3 text-sm whitespace-pre-wrap">
            {notes}
          </PopoverContent>
        </Popover>
      </span>
    </>
  );
};

export const TradeItemMarketDetails = ({
  item,
  isDuped = false,
}: {
  item: TradeItem;
  isDuped?: boolean;
}) => {
  const demand = isDuped
    ? (item.duped_demand ?? item.data?.duped_demand)
    : (item.demand ?? item.data?.demand);
  const trend = item.trend ?? item.data?.trend;

  return (
    <div className="border-border-card space-y-1 border-t pt-2 text-[11px]">
      <div className="flex min-w-0 items-center gap-1">
        <span className="text-secondary-text w-11 shrink-0">Demand</span>
        <span
          className={`${getDemandColor(demand)} min-w-0 truncate rounded px-1.5 py-0.5 font-semibold whitespace-nowrap`}
          title={hasItemValue(demand) ? demand : "Unknown"}
        >
          {hasItemValue(demand) ? demand : "Unknown"}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <span className="text-secondary-text w-11 shrink-0">Trend</span>
        <span
          className={`${getTrendColor(trend)} min-w-0 truncate rounded px-1.5 py-0.5 font-semibold whitespace-nowrap`}
          title={hasItemValue(trend) ? trend : "Unknown"}
        >
          {hasItemValue(trend) ? trend : "Unknown"}
        </span>
      </div>
    </div>
  );
};
