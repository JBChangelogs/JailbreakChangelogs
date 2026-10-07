import { isSeasonalItem } from "@/utils/items/season";
import React from "react";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { formatFullValue } from "@/utils/trading/values";
import { getDemandColor, getTrendColor } from "@/utils/items/badgeColors";
import { getTradeItemDetailHref } from "@/utils/trading/tradeItems";
import { Icon } from "@/components/ui/IconWrapper";
import { DupedBadge } from "@/components/trading/DupedBadge";
import { OgBadge } from "@/components/trading/OgBadge";

interface TradeAdTooltipProps {
  item: TradeItem;
}

export const TradeAdTooltip: React.FC<TradeAdTooltipProps> = ({ item }) => {
  const demand = item.demand ?? "N/A";
  const dupedDemand = item.duped_demand ?? "N/A";
  const trend = item.trend ?? null;
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
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
              style={{
                borderColor: getCategoryColor(item.type),
                backgroundColor: `${getCategoryColor(item.type)}22`,
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
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                <Icon
                  icon="mdi:clock"
                  className="h-3 w-3"
                  style={{ color: "#ffd700" }}
                />
                Limited
              </span>
            )}
            {isSeasonalItem(item) && (
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                <Icon
                  icon="noto-v1:snowflake"
                  className="h-3 w-3"
                  style={{ color: "#40c0e7" }}
                />
                Seasonal
              </span>
            )}
            {item.isDuped && <DupedBadge />}
            {item.isOG && <OgBadge />}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Cash:
            </span>
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-semibold whitespace-nowrap">
              {item.cash_value === null || item.cash_value === "N/A"
                ? "N/A"
                : formatFullValue(item.cash_value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Duped:
            </span>
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-semibold whitespace-nowrap">
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
              className={`${getDemandColor(demand)} inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-semibold whitespace-nowrap`}
            >
              {demand === "N/A" ? "Unknown" : demand}
            </span>
          </div>
          {item.isDuped && (
            <div className="flex items-center gap-2">
              <span className="text-secondary-text text-xs tracking-wider uppercase">
                Duped Demand:
              </span>
              <span
                className={`${getDemandColor(dupedDemand === "N/A" ? "Unknown" : dupedDemand)} inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-semibold whitespace-nowrap`}
              >
                {dupedDemand}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Trend:
            </span>
            <span
              className={`${getTrendColor(trend || "N/A")} inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-semibold whitespace-nowrap`}
            >
              {!trend || trend === "N/A" ? "Unknown" : trend}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
