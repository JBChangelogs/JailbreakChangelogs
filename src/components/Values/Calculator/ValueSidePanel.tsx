import React from "react";
import { TradeItem } from "@/types/trading";
import { getCategoryColor } from "@/utils/categoryIcons";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { formatCurrencyValue } from "./calculatorUtils";

interface ValueSidePanelProps {
  items: TradeItem[];
  side: "offering" | "requesting";
  total: number;
  getSelectedValue: (item: TradeItem) => number;
  getSelectedValueType: (item: TradeItem) => "cash" | "duped";
}

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
          <div className="flex items-center gap-2">
            <h4 className="text-primary-text text-lg font-semibold">
              {sideLabel} Side
            </h4>
          </div>
          <div className="flex gap-2">
            <span
              className={`bg-${side === "offering" ? "status-success" : "status-error"}/20 border-${side === "offering" ? "status-success" : "status-error"}/30 text-primary-text rounded-full border px-3 py-1 text-xs font-medium`}
            >
              {sideLabel}
            </span>
            <span className="border-border-card bg-tertiary-bg text-primary-text rounded-full border px-3 py-1 text-xs font-medium">
              {items.length} item
              {items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Items Container */}
      <div className="border-border-card bg-tertiary-bg space-y-4 rounded-xl border p-6">
        {items.map((item, index, array) => {
          const selectedType = getSelectedValueType(item);
          const isDupedSelected = selectedType === "duped";
          const demand = item.demand ?? item.data?.demand ?? "N/A";

          return (
            <div
              key={item.instanceId || `${item.id}-${index}`}
              className={`border-border-card bg-secondary-bg rounded-lg border p-4 ${
                index !== array.length - 1 ? "mb-4" : ""
              }`}
            >
              <div className="space-y-4">
                <div className="flex-1">
                  {/* Item Name */}
                  <div className="mb-3 flex items-center gap-2">
                    <h5 className="text-primary-text text-base font-semibold">
                      {item.name}
                    </h5>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-2">
                    {/* Type and Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-primary-text flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                        style={{
                          borderColor: getCategoryColor(item.type),
                          backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
                        }}
                      >
                        {item.type}
                      </span>
                      {(item.is_limited === 1 ||
                        item.data?.is_limited === 1) && (
                        <span className="bg-primary/10 border-primary/30 text-primary-text rounded-lg border px-2 py-1 text-xs font-medium">
                          Limited
                        </span>
                      )}
                      {(item.is_seasonal === 1 ||
                        item.data?.is_seasonal === 1) && (
                        <span className="bg-primary/10 border-primary/30 text-primary-text rounded-lg border px-2 py-1 text-xs font-medium">
                          Seasonal
                        </span>
                      )}
                      <span className="bg-tertiary-bg text-primary-text rounded-lg px-2 py-1 text-xs font-medium">
                        {isDupedSelected ? "Duped" : "Clean"}
                      </span>
                      <span
                        className={`${getDemandColor(demand)} rounded-lg px-2 py-1 text-xs font-semibold`}
                      >
                        {demand === "N/A" ? "Unknown" : demand}
                      </span>
                      <span
                        className={`${getTrendColor(item.trend || "N/A")} rounded-lg px-2 py-1 text-xs font-semibold`}
                      >
                        {!("trend" in item) ||
                        item.trend === null ||
                        item.trend === "N/A"
                          ? "Unknown"
                          : (item.trend as string)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Value */}
                <div className="text-center sm:text-right">
                  <span className="text-primary-text text-lg font-bold">
                    {formatCurrencyValue(getSelectedValue(item))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="border-border-card bg-secondary-bg mt-4 rounded-lg border p-4">
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
