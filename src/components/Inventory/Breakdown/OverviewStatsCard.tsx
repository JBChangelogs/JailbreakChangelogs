import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatInventoryCount,
  formatNetworth,
} from "@/components/Inventory/Breakdown/constants";

interface OverviewStatsCardProps {
  totalItems: number;
  networth: number;
  inventoryValue?: number;
  money: number;
}

export default function OverviewStatsCard({
  totalItems,
  networth,
  inventoryValue,
  money,
}: OverviewStatsCardProps) {
  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
      <h4 className="text-primary-text mb-3 text-sm font-semibold">Overview</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-1 text-sm">Total Items</div>
          <div className="text-primary-text text-lg font-bold">
            {formatInventoryCount(totalItems)}
          </div>
        </div>
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-1 flex items-center justify-center gap-1.5 text-sm">
            Total Networth
            <Tooltip>
              <TooltipTrigger asChild>
                <Icon
                  icon="material-symbols:info-outline"
                  className="text-secondary-text h-4 w-4 cursor-help"
                  inline={true}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
              >
                Includes total cash value of all items, including duped
                items&apos; cash value.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-primary-text text-lg font-bold">
            ${formatNetworth(networth)}
          </div>
        </div>
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-1 flex items-center justify-center gap-1.5 text-sm">
            Inventory Value
            <Tooltip>
              <TooltipTrigger asChild>
                <Icon
                  icon="material-symbols:info-outline"
                  className="text-secondary-text h-4 w-4 cursor-help"
                  inline={true}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
              >
                Only counts clean items&apos; cash value. Does not include cash
                value of duped items.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-primary-text text-lg font-bold">
            $
            {inventoryValue !== undefined
              ? formatNetworth(inventoryValue)
              : "0"}
          </div>
        </div>
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-1 text-sm">Cash</div>
          <div className="text-primary-text text-lg font-bold">
            ${formatNetworth(money)}
          </div>
        </div>
      </div>
    </div>
  );
}
