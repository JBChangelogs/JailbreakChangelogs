import React from "react";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { formatFullValue } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { Icon } from "@/components/ui/IconWrapper";
import { getTradeItemDetailHref } from "@/utils/tradeItems";

interface TradeAdTooltipProps {
  item: TradeItem;
}

export const TradeAdTooltip: React.FC<TradeAdTooltipProps> = ({ item }) => {
  const demand = item.demand ?? item.data?.demand ?? "N/A";
  const trend = item.trend ?? item.data?.trend ?? null;
  const itemHref = getTradeItemDetailHref(item);

  return (
    <div className="p-4">
      {/* Item Details */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {itemHref ? (
              <Link
                href={itemHref}
                prefetch={false}
                className="link-text hover:text-link-hover truncate text-lg font-semibold transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="link-text truncate text-lg font-semibold">
                {item.name}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
              style={{
                borderColor: getCategoryColor(item.type),
              }}
            >
              {(() => {
                const categoryIcon = getCategoryIcon(item.type);
                return categoryIcon ? (
                  <categoryIcon.Icon
                    className="h-3 w-3"
                    style={{ color: getCategoryColor(item.type) }}
                  />
                ) : null;
              })()}
              {item.type}
            </span>
            {item.is_limited === 1 && (
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                Limited
              </span>
            )}
            {item.is_seasonal === 1 && (
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                Seasonal
              </span>
            )}
            {item.isDuped && (
              <span className="border-status-error bg-status-error/90 text-form-button-text flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-semibold">
                Duped
              </span>
            )}
            {item.isOG && (
              <span className="text-primary-text bg-tertiary-bg/40 border-border-card inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-sm">
                <Icon icon="mdi:star-four-points" className="h-3.5 w-3.5" />
                OG
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Cash:
            </span>
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-semibold whitespace-nowrap">
              {item.cash_value === null || item.cash_value === "N/A"
                ? "N/A"
                : formatFullValue(item.cash_value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Duped:
            </span>
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-semibold whitespace-nowrap">
              {item.duped_value === null || item.duped_value === "N/A"
                ? "N/A"
                : formatFullValue(item.duped_value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Demand:
            </span>
            <span
              className={`${getDemandColor(demand)} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-semibold whitespace-nowrap`}
            >
              {demand === "N/A" ? "Unknown" : demand}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Trend:
            </span>
            <span
              className={`${getTrendColor(trend || "N/A")} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-semibold whitespace-nowrap`}
            >
              {!trend || trend === "N/A" ? "Unknown" : trend}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
