import React from "react";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import {
  getItemTypeColor,
  getDemandColor,
  getTrendColor,
} from "@/utils/badgeColors";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { formatFullValue } from "@/utils/values";

interface TradeAdTooltipProps {
  item: TradeItem;
}

export const TradeAdTooltip: React.FC<TradeAdTooltipProps> = ({ item }) => {
  const categoryIcon = getCategoryIcon(item.type);
  const demand = item.demand ?? item.data?.demand ?? "N/A";
  const trend = item.trend ?? item.data?.trend ?? null;

  return (
    <div className="p-2">
      <div className="flex gap-3">
        {/* Item Icon */}
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#2E3944]">
          {categoryIcon && (
            <div className="rounded-full bg-black/50 p-3">
              <categoryIcon.Icon
                className="h-8 w-8"
                style={{ color: categoryIcon.color }}
              />
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <Link
              href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${item.sub_name ? `?variant=${item.sub_name}` : ""}`}
              className="text-muted truncate text-lg font-semibold transition-colors hover:text-blue-400"
            >
              {item.base_name && item.sub_name
                ? `${item.base_name} (${item.sub_name})`
                : item.name}
            </Link>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="inline-block rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: getItemTypeColor(item.type) }}
              >
                {item.type}
              </span>
              {item.is_limited === 1 && (
                <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">
                  Limited
                </span>
              )}
              {item.is_seasonal === 1 && (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400">
                  Seasonal
                </span>
              )}
              {item.tradable !== 1 && (
                <span className="flex-shrink-0 rounded-full border border-red-500 bg-red-500/90 px-1.5 py-0.5 text-xs text-white">
                  Non-Tradable
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span>Cash:</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
                style={{ backgroundColor: "#1d7da3" }}
              >
                {item.cash_value === null || item.cash_value === "N/A"
                  ? "N/A"
                  : formatFullValue(item.cash_value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Duped:</span>
              <span className="rounded-full bg-gray-600 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white">
                {item.duped_value === null || item.duped_value === "N/A"
                  ? "N/A"
                  : formatFullValue(item.duped_value)}
              </span>
            </div>
            <div className="text-muted flex items-center gap-2">
              <span>Demand:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white ${getDemandColor(demand)}`}
              >
                {demand === "N/A" ? "Unknown" : demand}
              </span>
            </div>
            <div className="text-muted flex items-center gap-2">
              <span>Trend:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white ${getTrendColor(trend || "Unknown")}`}
              >
                {!trend || trend === "N/A" ? "Unknown" : trend}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
