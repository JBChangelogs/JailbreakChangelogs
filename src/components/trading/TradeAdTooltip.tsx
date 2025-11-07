import React from "react";
import Link from "next/link";
import { TradeItem } from "@/types/trading";
import { CategoryIconBadge, getCategoryColor } from "@/utils/categoryIcons";
import { formatFullValue } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";

interface TradeAdTooltipProps {
  item: TradeItem;
}

export const TradeAdTooltip: React.FC<TradeAdTooltipProps> = ({ item }) => {
  const demand = item.demand ?? item.data?.demand ?? "N/A";
  const trend = item.trend ?? item.data?.trend ?? null;

  return (
    <div className="p-4">
      {/* Item Details */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryIconBadge
              type={item.type}
              isLimited={item.is_limited === 1}
              isSeasonal={item.is_seasonal === 1}
              hasChildren={!!item.children?.length}
              showCategoryForVariants={true}
              preferItemType={true}
              className="h-5 w-5"
            />
            <Link
              href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${item.sub_name ? `?variant=${item.sub_name}` : ""}`}
              prefetch={false}
              className="link-text hover:text-link-hover truncate text-lg font-semibold transition-colors"
            >
              {item.base_name && item.sub_name
                ? `${item.base_name} (${item.sub_name})`
                : item.name}
            </Link>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
              style={{
                borderColor: getCategoryColor(item.type),
                backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
              }}
            >
              {item.type}
            </span>
            {item.is_limited === 1 && (
              <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-0.5 text-xs">
                Limited
              </span>
            )}
            {item.is_seasonal === 1 && (
              <span className="border-primary-text text-primary-text flex items-center rounded-full border bg-transparent px-2 py-0.5 text-xs">
                Seasonal
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Cash:
            </span>
            <span className="bg-button-info text-form-button-text rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
              {item.cash_value === null || item.cash_value === "N/A"
                ? "N/A"
                : formatFullValue(item.cash_value)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Duped:
            </span>
            <span className="bg-button-info text-form-button-text rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
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
              className={`${getDemandColor(demand)} rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap`}
            >
              {demand === "N/A" ? "Unknown" : demand}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-text text-xs tracking-wider uppercase">
              Trend:
            </span>
            <span
              className={`${getTrendColor(trend || "N/A")} rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap`}
            >
              {!trend || trend === "N/A" ? "Unknown" : trend}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
