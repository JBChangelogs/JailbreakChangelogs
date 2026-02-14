import React, { useState } from "react";
import { TradeItem } from "@/types/trading";
import { Icon } from "@/components/ui/IconWrapper";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { formatCurrencyValue, parseValueString } from "./calculatorUtils";

interface ValueSidePanelProps {
  items: TradeItem[];
  side: "offering" | "requesting";
  total: number;
  getSelectedValue: (item: TradeItem) => number;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
}

interface ValueItemRowProps {
  item: TradeItem;
  getSelectedValue: (item: TradeItem) => number;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
}

const ValueItemRow: React.FC<ValueItemRowProps> = ({
  item,
  getSelectedValue,
  getSelectedValueType,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const demand = item.demand ?? item.data?.demand ?? "N/A";
  const trend = item.trend ?? item.data?.trend ?? "N/A";
  const selectedType = getSelectedValueType(item);

  return (
    <div
      className="bg-tertiary-bg rounded-lg p-4 transition-colors hover:cursor-pointer"
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="text-primary-text truncate text-base font-semibold">
            {item.name}
          </h5>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
              style={{ borderColor: getCategoryColor(item.type) }}
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
            {(item.is_limited === 1 || item.data?.is_limited === 1) && (
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                <Icon
                  icon="mdi:clock"
                  className="h-3 w-3"
                  style={{ color: "#ffd700" }}
                />
                Limited
              </span>
            )}
            {(item.is_seasonal === 1 || item.data?.is_seasonal === 1) && (
              <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                <Icon
                  icon="noto-v1:snowflake"
                  className="h-3 w-3"
                  style={{ color: "#40c0e7" }}
                />
                Seasonal
              </span>
            )}
            <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
              {selectedType === "duped" ? "Duped" : "Clean"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary-text text-lg font-bold">
            {formatCurrencyValue(getSelectedValue(item))}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="text-secondary-text hover:text-primary-text p-1 transition-colors"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            <Icon
              icon={
                isExpanded
                  ? "heroicons-outline:chevron-down"
                  : "heroicons-outline:chevron-right"
              }
              className="h-4 w-4"
              inline={true}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-2">
            <span className="text-secondary-text text-xs font-medium">
              Cash Value
            </span>
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap shadow-sm min-[480px]:px-3">
              {item.cash_value === null || item.cash_value === "N/A"
                ? "N/A"
                : formatCurrencyValue(parseValueString(item.cash_value))}
            </span>
          </div>
          <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-2">
            <span className="text-secondary-text text-xs font-medium">
              Duped Value
            </span>
            <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap shadow-sm min-[480px]:px-3">
              {item.duped_value === null || item.duped_value === "N/A"
                ? "N/A"
                : formatCurrencyValue(parseValueString(item.duped_value))}
            </span>
          </div>
          <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-2">
            <span className="text-secondary-text text-xs font-medium">
              Demand
            </span>
            <span
              className={`${getDemandColor(demand)} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap shadow-sm min-[480px]:px-3`}
            >
              {demand === "N/A" ? "Unknown" : demand}
            </span>
          </div>
          <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-2">
            <span className="text-secondary-text text-xs font-medium">
              Trend
            </span>
            <span
              className={`${getTrendColor(trend || "N/A")} inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold whitespace-nowrap shadow-sm min-[480px]:px-3`}
            >
              {trend === "N/A" ? "Unknown" : trend}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const ValueSidePanel: React.FC<ValueSidePanelProps> = ({
  items,
  side,
  total,
  getSelectedValue,
  getSelectedValueType,
}) => {
  const sideLabel = side === "offering" ? "Offering" : "Requesting";

  return (
    <div className="relative">
      {/* Side Header */}
      <div className="mb-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h4 className="text-primary-text text-lg font-semibold">
            {sideLabel} Side
          </h4>
          <div className="flex gap-2">
            <span
              className={`text-primary-text hidden h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl sm:inline-flex ${
                side === "offering"
                  ? "border-status-success/40 bg-status-success/15"
                  : "border-status-error/40 bg-status-error/15"
              }`}
            >
              {sideLabel}
            </span>
            <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
              {items.length} item
              {items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Items Container */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <ValueItemRow
            key={item.instanceId || `${item.id}-${index}`}
            item={item}
            getSelectedValue={getSelectedValue}
            getSelectedValueType={getSelectedValueType}
          />
        ))}

        {/* Total */}
        <div className="border-border-card bg-tertiary-bg mt-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-primary-text text-base font-semibold">
              Total
            </span>
            <div className="text-right">
              <div className="text-primary-text text-xl font-bold">
                {formatCurrencyValue(total)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
