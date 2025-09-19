import React from "react";
import { TradeItem } from "@/types/trading";
import {
  FaArrowUp,
  FaArrowDown,
  FaArrowUp as FaTrendingUp,
  FaArrowDown as FaTrendingDown,
  FaMinus,
  FaExclamationTriangle,
} from "react-icons/fa";
import Link from "next/link";
import {
  getItemTypeColor,
  getDemandColor,
  getTrendColor,
} from "@/utils/badgeColors";

interface TradeValueComparisonProps {
  offering: TradeItem[];
  requesting: TradeItem[];
}

const parseCurrencyValue = (value: string): number => {
  if (!value || value === "N/A") return 0;

  // Remove any non-numeric characters except decimal point and k/m
  const cleanValue = value.toLowerCase().replace(/[^0-9.kms]/g, "");

  // Extract the numeric part and suffix
  const match = cleanValue.match(/^([0-9.]+)([km]?)$/);
  if (!match) return 0;

  const [, num, suffix] = match;
  const numericValue = parseFloat(num);

  // Apply multiplier based on suffix
  switch (suffix) {
    case "k":
      return numericValue * 1000;
    case "m":
      return numericValue * 1000000;
    default:
      return numericValue;
  }
};

const formatCurrencyValue = (value: number): string => {
  return value.toLocaleString();
};

const getItemData = (item: TradeItem): TradeItem => {
  if ("data" in item && item.data) {
    return {
      ...item.data,
      id: item.id,
      is_sub: "sub_name" in item,
      sub_name: "sub_name" in item ? item.sub_name : undefined,
      tradable: item.data.tradable ? 1 : 0,
      is_limited: item.data.is_limited ?? 0,
      name:
        "sub_name" in item
          ? `${item.data.name} (${item.sub_name})`
          : item.data.name,
      base_name: item.data.name,
      trend: item.trend ?? item.data?.trend ?? null,
    };
  }
  return item;
};

const groupItems = (items: TradeItem[]) => {
  const grouped = items.reduce(
    (acc, item) => {
      const itemData = getItemData(item);
      const key = `${item.id}-${itemData.name}-${itemData.type}`;
      if (!acc[key]) {
        acc[key] = { ...itemData, count: 1 };
      } else {
        acc[key].count++;
      }
      return acc;
    },
    {} as Record<string, TradeItem & { count: number }>,
  );

  return Object.values(grouped);
};

export default function TradeValueComparison({
  offering,
  requesting,
}: TradeValueComparisonProps) {
  return (
    <div className="rounded-lg bg-[#2E3944] p-6">
      <h3 className="text-muted mb-4 text-lg font-semibold">
        Value Comparison
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Offering Side */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h4 className="text-muted font-medium">Offering Side</h4>
            <span className="rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2 py-0.5 text-xs text-white">
              {groupItems(offering).reduce((sum, item) => sum + item.count, 0)}{" "}
              item
              {groupItems(offering).reduce(
                (sum, item) => sum + item.count,
                0,
              ) !== 1
                ? "s"
                : ""}
            </span>
          </div>
          <div className="rounded-lg bg-[#37424D] p-4">
            <div className="space-y-2">
              {groupItems(offering).map((item, index, array) => (
                <div
                  key={`${item.id}`}
                  className={`flex items-center justify-between ${index !== array.length - 1 ? "border-b border-[#4A5568] pb-3" : ""}`}
                >
                  <div>
                    <Link
                      href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${"sub_name" in item ? `?variant=${item.sub_name}` : ""}`}
                      className="font-medium text-[#FFFFFF] transition-colors hover:text-blue-400"
                    >
                      {item.base_name && item.sub_name
                        ? `${item.base_name} (${item.sub_name})`
                        : item.name}
                      {item.count > 1 && (
                        <span className="ml-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2.5 py-1 text-sm text-white">
                          ×{item.count}
                        </span>
                      )}
                    </Link>
                    <div className="mt-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs text-white"
                        style={{ backgroundColor: getItemTypeColor(item.type) }}
                        aria-label={`Item type: ${item.type}`}
                      >
                        {item.type}
                      </span>
                      {item.is_limited === 1 && (
                        <span
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500"
                          aria-label="Limited item"
                        >
                          Limited
                        </span>
                      )}
                      {item.is_seasonal === 1 && (
                        <span
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400"
                          aria-label="Seasonal item"
                        >
                          Seasonal
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-muted text-xs">Demand:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${getDemandColor(item.demand ?? "N/A")}`}
                        aria-label={`Demand level: ${(item.demand ?? "N/A") === "N/A" ? "Unknown" : (item.demand as string)}`}
                      >
                        {(item.demand ?? "N/A") === "N/A"
                          ? "Unknown"
                          : (item.demand as string)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-muted text-xs">Trend:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${getTrendColor(item.trend || "Unknown")}`}
                        aria-label={`Price trend: ${
                          !("trend" in item) ||
                          item.trend === null ||
                          item.trend === "N/A"
                            ? "Unknown"
                            : (item.trend as string)
                        }`}
                      >
                        {(() => {
                          const trend =
                            !("trend" in item) ||
                            item.trend === null ||
                            item.trend === "N/A"
                              ? "Unknown"
                              : (item.trend as string);

                          // Add trend icon based on trend type
                          if (trend === "Rising" || trend === "Hyped")
                            return (
                              <>
                                <FaTrendingUp className="text-xs" /> {trend}
                              </>
                            );
                          if (trend === "Dropping" || trend === "Avoided")
                            return (
                              <>
                                <FaTrendingDown className="text-xs" /> {trend}
                              </>
                            );
                          if (trend === "Stable")
                            return (
                              <>
                                <FaMinus className="text-xs" /> {trend}
                              </>
                            );
                          if (trend === "Unstable")
                            return (
                              <>
                                <FaExclamationTriangle className="text-xs" />{" "}
                                {trend}
                              </>
                            );
                          return trend;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted">
                      Cash:{" "}
                      {item.cash_value === null || item.cash_value === "N/A"
                        ? "N/A"
                        : formatCurrencyValue(
                            parseCurrencyValue(item.cash_value),
                          )}
                    </div>
                    <div className="text-muted">
                      Duped:{" "}
                      {item.duped_value === null || item.duped_value === "N/A"
                        ? "N/A"
                        : formatCurrencyValue(
                            parseCurrencyValue(item.duped_value),
                          )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-[#4A5568] pt-2 font-medium">
                <span className="text-muted">Total</span>
                <div className="text-right">
                  <div className="text-[#FFFFFF]">
                    Cash:{" "}
                    {formatCurrencyValue(
                      groupItems(offering).reduce(
                        (sum, item) =>
                          sum +
                          parseCurrencyValue(item.cash_value) * item.count,
                        0,
                      ),
                    )}
                  </div>
                  <div className="text-[#FFFFFF]">
                    Duped:{" "}
                    {formatCurrencyValue(
                      groupItems(offering).reduce(
                        (sum, item) =>
                          sum +
                          parseCurrencyValue(item.duped_value) * item.count,
                        0,
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requesting Side */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h4 className="text-muted font-medium">Requesting Side</h4>
            <span className="rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2 py-0.5 text-xs text-white">
              {groupItems(requesting).reduce(
                (sum, item) => sum + item.count,
                0,
              )}{" "}
              item
              {groupItems(requesting).reduce(
                (sum, item) => sum + item.count,
                0,
              ) !== 1
                ? "s"
                : ""}
            </span>
          </div>
          <div className="rounded-lg bg-[#37424D] p-4">
            <div className="space-y-2">
              {groupItems(requesting).map((item, index, array) => (
                <div
                  key={`${item.id}`}
                  className={`flex items-center justify-between ${index !== array.length - 1 ? "border-b border-[#4A5568] pb-3" : ""}`}
                >
                  <div>
                    <Link
                      href={`/item/${item.type.toLowerCase()}/${item.base_name || item.name}${"sub_name" in item ? `?variant=${item.sub_name}` : ""}`}
                      className="font-medium text-[#FFFFFF] transition-colors hover:text-blue-400"
                    >
                      {item.base_name && item.sub_name
                        ? `${item.base_name} (${item.sub_name})`
                        : item.name}
                      {item.count > 1 && (
                        <span className="ml-2 rounded-full border border-[#5865F2]/20 bg-[#5865F2] px-2.5 py-1 text-sm text-white">
                          ×{item.count}
                        </span>
                      )}
                    </Link>
                    <div className="mt-1">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs text-white"
                        style={{ backgroundColor: getItemTypeColor(item.type) }}
                        aria-label={`Item type: ${item.type}`}
                      >
                        {item.type}
                      </span>
                      {item.is_limited === 1 && (
                        <span
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500"
                          aria-label="Limited item"
                        >
                          Limited
                        </span>
                      )}
                      {item.is_seasonal === 1 && (
                        <span
                          className="ml-2 inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-400"
                          aria-label="Seasonal item"
                        >
                          Seasonal
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-muted text-xs">Demand:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${getDemandColor(item.demand ?? "N/A")}`}
                        aria-label={`Demand level: ${(item.demand ?? "N/A") === "N/A" ? "Unknown" : (item.demand as string)}`}
                      >
                        {(item.demand ?? "N/A") === "N/A"
                          ? "Unknown"
                          : (item.demand as string)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-muted text-xs">Trend:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${getTrendColor(item.trend || "Unknown")}`}
                        aria-label={`Price trend: ${
                          !("trend" in item) ||
                          item.trend === null ||
                          item.trend === "N/A"
                            ? "Unknown"
                            : (item.trend as string)
                        }`}
                      >
                        {(() => {
                          const trend =
                            !("trend" in item) ||
                            item.trend === null ||
                            item.trend === "N/A"
                              ? "Unknown"
                              : (item.trend as string);

                          // Add trend icon based on trend type
                          if (trend === "Rising" || trend === "Hyped")
                            return (
                              <>
                                <FaTrendingUp className="text-xs" /> {trend}
                              </>
                            );
                          if (trend === "Dropping" || trend === "Avoided")
                            return (
                              <>
                                <FaTrendingDown className="text-xs" /> {trend}
                              </>
                            );
                          if (trend === "Stable")
                            return (
                              <>
                                <FaMinus className="text-xs" /> {trend}
                              </>
                            );
                          if (trend === "Unstable")
                            return (
                              <>
                                <FaExclamationTriangle className="text-xs" />{" "}
                                {trend}
                              </>
                            );
                          return trend;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted">
                      Cash:{" "}
                      {item.cash_value === null || item.cash_value === "N/A"
                        ? "N/A"
                        : formatCurrencyValue(
                            parseCurrencyValue(item.cash_value),
                          )}
                    </div>
                    <div className="text-muted">
                      Duped:{" "}
                      {item.duped_value === null || item.duped_value === "N/A"
                        ? "N/A"
                        : formatCurrencyValue(
                            parseCurrencyValue(item.duped_value),
                          )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-[#4A5568] pt-2 font-medium">
                <span className="text-muted">Total</span>
                <div className="text-right">
                  <div className="text-[#FFFFFF]">
                    Cash:{" "}
                    {formatCurrencyValue(
                      groupItems(requesting).reduce(
                        (sum, item) =>
                          sum +
                          parseCurrencyValue(item.cash_value) * item.count,
                        0,
                      ),
                    )}
                  </div>
                  <div className="text-[#FFFFFF]">
                    Duped:{" "}
                    {formatCurrencyValue(
                      groupItems(requesting).reduce(
                        (sum, item) =>
                          sum +
                          parseCurrencyValue(item.duped_value) * item.count,
                        0,
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Difference */}
      <div className="mt-6 rounded-lg bg-[#37424D] p-4">
        <h4 className="text-muted mb-3 font-medium">Overall Difference</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted">Cash Value Difference</span>
            <span
              className={(() => {
                const offeringTotal = groupItems(offering).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.cash_value) * item.count,
                  0,
                );
                const requestingTotal = groupItems(requesting).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.cash_value) * item.count,
                  0,
                );
                const diff = offeringTotal - requestingTotal;
                if (diff < 0)
                  return "inline-flex items-center gap-2 rounded-full border border-[#43B581]/30 bg-[#43B581]/20 px-3 py-1 text-base font-semibold text-white shadow-sm";
                if (diff > 0)
                  return "inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1 text-base font-semibold text-white shadow-sm";
                return "inline-flex items-center gap-2 rounded-full border border-gray-500/30 bg-gray-500/20 px-3 py-1 text-base font-semibold text-white shadow-sm";
              })()}
            >
              {(() => {
                const offeringTotal = groupItems(offering).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.cash_value) * item.count,
                  0,
                );
                const requestingTotal = groupItems(requesting).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.cash_value) * item.count,
                  0,
                );
                const diff = offeringTotal - requestingTotal;
                return (
                  <>
                    {diff !== 0 &&
                      (diff < 0 ? (
                        <FaArrowUp className="text-[#43B581]" />
                      ) : (
                        <FaArrowDown className="text-red-500" />
                      ))}
                    {formatCurrencyValue(Math.abs(diff))}
                  </>
                );
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Duped Value Difference</span>
            <span
              className={(() => {
                const offeringTotal = groupItems(offering).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.duped_value) * item.count,
                  0,
                );
                const requestingTotal = groupItems(requesting).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.duped_value) * item.count,
                  0,
                );
                const diff = offeringTotal - requestingTotal;
                if (diff < 0)
                  return "inline-flex items-center gap-2 rounded-full border border-[#43B581]/30 bg-[#43B581]/20 px-3 py-1 text-base font-semibold text-white shadow-sm";
                if (diff > 0)
                  return "inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1 text-base font-semibold text-white shadow-sm";
                return "inline-flex items-center gap-2 rounded-full border border-gray-500/30 bg-gray-500/20 px-3 py-1 text-base font-semibold text-white shadow-sm";
              })()}
            >
              {(() => {
                const offeringTotal = groupItems(offering).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.duped_value) * item.count,
                  0,
                );
                const requestingTotal = groupItems(requesting).reduce(
                  (sum, item) =>
                    sum + parseCurrencyValue(item.duped_value) * item.count,
                  0,
                );
                const diff = offeringTotal - requestingTotal;
                return (
                  <>
                    {diff !== 0 &&
                      (diff < 0 ? (
                        <FaArrowUp className="text-[#43B581]" />
                      ) : (
                        <FaArrowDown className="text-red-500" />
                      ))}
                    {formatCurrencyValue(Math.abs(diff))}
                  </>
                );
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
