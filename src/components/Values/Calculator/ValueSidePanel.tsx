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
  const isOffering = side === "offering";
  const sideColor = isOffering ? "status-success" : "status-error";
  const sideLabel = isOffering ? "Offering" : "Requesting";

  return (
    <div className="relative">
      {/* Side Header */}
      <div className="mb-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <div className={`bg-${sideColor} h-3 w-3 rounded-full`}></div>
            <h4 className="text-primary-text text-lg font-semibold">
              {sideLabel} Side
            </h4>
          </div>
          <div className="flex gap-2">
            <span
              className={`bg-${sideColor}/20 border-${sideColor}/30 text-primary-text rounded-full border px-3 py-1 text-xs font-medium`}
            >
              {sideLabel}
            </span>
            <span className="bg-primary/10 border-primary/20 text-primary-text rounded-full border px-3 py-1 text-xs font-medium">
              {items.length} item
              {items.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Items Container */}
      <div className={`bg-${sideColor}/5 space-y-4 rounded-xl p-6`}>
        {items.map((item, index, array) => {
          const selectedType = getSelectedValueType(item);
          const isDupedSelected = selectedType === "duped";
          const demand = item.demand ?? item.data?.demand ?? "N/A";

          return (
            <div
              key={item.instanceId || `${item.id}-${index}`}
              className={`bg-${sideColor}/5 hover:bg-${sideColor}/10 rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
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
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${
                          isDupedSelected
                            ? "bg-status-error/10 text-primary-text"
                            : "bg-status-success/10 text-primary-text"
                        }`}
                      >
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
                  <span className="bg-button-info text-form-button-text inline-block rounded-lg px-3 py-2 text-lg font-bold">
                    {formatCurrencyValue(getSelectedValue(item))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className={`bg-${sideColor}/5 mt-4 rounded-lg p-4`}>
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
