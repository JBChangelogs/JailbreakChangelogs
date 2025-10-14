"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TradeItem } from "@/types/trading";
import { getItemImagePath, handleImageError } from "@/utils/images";
import { Icon } from "../../UI/IconWrapper";
import { formatFullValue, demandOrder } from "@/utils/values";
import { getDemandColor, getTrendColor } from "@/utils/badgeColors";
import { getCategoryColor } from "@/utils/categoryIcons";

interface TotalSimilarItemsProps {
  targetValue: number;
  items: TradeItem[];
  excludeItems?: TradeItem[];
  typeFilter?: string | null; // when null/undefined, include all types
  range?: number; // +/- range in raw value, default 2.5m
  title?: string;
  contextLabel?: string;
  baselineDemand?: string | null;
  enableDemandSort?: boolean;
  valuePreference?: "cash" | "duped";
}

const parseValue = (value: string): number => {
  if (!value || value === "N/A") return 0;
  const lower = value.toLowerCase();
  const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(num)) return 0;
  if (lower.includes("k")) return num * 1_000;
  if (lower.includes("m")) return num * 1_000_000;
  if (lower.includes("b")) return num * 1_000_000_000;
  return num;
};

const getItemDemand = (item: TradeItem): string => {
  return item.demand ?? item.data?.demand ?? "N/A";
};

const getDemandIndex = (demand: string): number => {
  return demandOrder.indexOf(demand as (typeof demandOrder)[number]);
};

export const TotalSimilarItems: React.FC<TotalSimilarItemsProps> = ({
  targetValue,
  items,
  excludeItems = [],
  typeFilter = null,
  range = 2_500_000,
  title,
  contextLabel, // eslint-disable-line @typescript-eslint/no-unused-vars
  baselineDemand = null,
  enableDemandSort = true,
  valuePreference = "cash",
}) => {
  const [sortMode, setSortMode] = useState<
    "diff" | "demand-desc" | "demand-asc"
  >("diff");

  const candidates = useMemo(() => {
    if (!items?.length || targetValue <= 0)
      return [] as Array<{ item: TradeItem; diff: number }>;
    const excludeIdSet = new Set(excludeItems.map((i) => i.id));
    const pool = (
      typeFilter
        ? items.filter((i) => i.type.toLowerCase() === typeFilter.toLowerCase())
        : items
    )
      .filter((i) => !excludeIdSet.has(i.id))
      .filter((i) =>
        valuePreference === "duped"
          ? i.duped_value && i.duped_value !== "N/A"
          : true,
      );
    const min = Math.max(0, targetValue - range);
    const max = targetValue + range;
    const withinRange = pool
      .map((item) => {
        const valueString =
          valuePreference === "duped" &&
          item.duped_value &&
          item.duped_value !== "N/A"
            ? item.duped_value
            : item.cash_value;
        const val = parseValue(valueString);
        return { item, val, diff: Math.abs(val - targetValue) };
      })
      .filter(({ val }) => val >= min && val <= max);

    let sorted;
    if (sortMode === "demand-desc" || sortMode === "demand-asc") {
      sorted = withinRange.sort((a, b) => {
        const aIdx = getDemandIndex(getItemDemand(a.item));
        const bIdx = getDemandIndex(getItemDemand(b.item));
        return sortMode === "demand-desc" ? bIdx - aIdx : aIdx - bIdx;
      });
    } else {
      sorted = withinRange.sort((a, b) => a.diff - b.diff);
    }
    return sorted.slice(0, 12).map(({ item, diff }) => ({ item, diff }));
  }, [
    items,
    excludeItems,
    targetValue,
    range,
    typeFilter,
    sortMode,
    valuePreference,
  ]);

  if (targetValue <= 0) return null;

  const heading =
    title ||
    (typeFilter
      ? `Similar ${typeFilter}s Near Total`
      : "Similar Items Near Total");
  const baselineDemandIndex = baselineDemand
    ? getDemandIndex(baselineDemand)
    : -1;

  return (
    <div className="bg-primary-bg rounded-lg p-8 transition-colors duration-200">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-primary-text text-2xl font-bold">{heading}</h3>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {enableDemandSort && (
              <div className="bg-primary-bg border-primary/10 flex w-full flex-col overflow-hidden rounded-lg border sm:w-auto sm:flex-row">
                <button
                  onClick={() => setSortMode("diff")}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    sortMode === "diff"
                      ? "bg-button-info text-form-button-text shadow-sm"
                      : "text-secondary-text hover:bg-primary/10 hover:text-primary-text"
                  }`}
                >
                  Closest
                </button>
                <button
                  onClick={() => setSortMode("demand-desc")}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    sortMode === "demand-desc"
                      ? "bg-button-info text-form-button-text shadow-sm"
                      : "text-secondary-text hover:bg-primary/10 hover:text-primary-text"
                  }`}
                >
                  Demand ↓
                </button>
                <button
                  onClick={() => setSortMode("demand-asc")}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    sortMode === "demand-asc"
                      ? "bg-button-info text-form-button-text shadow-sm"
                      : "text-secondary-text hover:bg-primary/10 hover:text-primary-text"
                  }`}
                >
                  Demand ↑
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-secondary-text rounded-lg p-6 text-center text-sm">
          No items found within ±{range.toLocaleString()} of your total.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {candidates.map(({ item, diff }) => {
            const comparisonValueString =
              valuePreference === "duped" &&
              item.duped_value &&
              item.duped_value !== "N/A"
                ? item.duped_value
                : item.cash_value;
            const itemValue = parseValue(comparisonValueString);
            const isAbove = itemValue > targetValue;
            const itemDemand = getItemDemand(item);
            const itemDemandIndex = getDemandIndex(itemDemand);
            const demandDelta =
              baselineDemandIndex >= 0 && itemDemandIndex >= 0
                ? itemDemandIndex - baselineDemandIndex
                : null;
            const displayName = item.sub_name
              ? `${item.name} (${item.sub_name})`
              : item.name;
            return (
              <Link
                key={`${item.id}-${item.sub_name || "base"}`}
                href={`/item/${item.type.toLowerCase()}/${item.name}${item.sub_name ? `?variant=${item.sub_name}` : ""}`}
                className="group"
              >
                <div className="bg-primary-bg overflow-hidden rounded-xl transition-all duration-200 hover:shadow-lg">
                  {/* Image Section */}
                  <div className="relative aspect-video">
                    <Image
                      src={getItemImagePath(item.type, item.name, true)}
                      alt={displayName}
                      fill
                      className="object-cover"
                      onError={handleImageError}
                    />
                  </div>

                  {/* Content Section */}
                  <div className="bg-secondary-bg space-y-4 p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-primary-text group-hover:text-link line-clamp-2 text-base font-semibold transition-colors">
                        {displayName}
                      </h4>
                      <span
                        className="text-primary-text flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                        style={{
                          borderColor: getCategoryColor(item.type),
                          backgroundColor: getCategoryColor(item.type) + "20", // Add 20% opacity
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    {/* Values and Stats */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-button-info text-form-button-text inline-block rounded-lg px-2 py-1 text-sm font-semibold">
                        Cash: {formatFullValue(item.cash_value)}
                      </span>
                      <span className="bg-button-info text-form-button-text inline-block rounded-lg px-2 py-1 text-sm font-semibold">
                        Duped: {formatFullValue(item.duped_value)}
                      </span>
                      <span
                        className={`${getDemandColor(itemDemand)} inline-block rounded-lg px-2 py-1 text-sm font-semibold`}
                      >
                        {itemDemand === "N/A" ? "Unknown" : itemDemand}
                      </span>
                      <span
                        className={`${getTrendColor(item.trend || "N/A")} inline-block rounded-lg px-2 py-1 text-sm font-semibold`}
                      >
                        {!item.trend || item.trend === "N/A"
                          ? "Unknown"
                          : item.trend}
                      </span>
                    </div>

                    {/* Comparison Section */}
                    <div className="border-border-primary space-y-2 border-t pt-3">
                      {/* Value Comparison */}
                      {diff === 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-status-info h-2 w-2 rounded-full"></div>
                          <span className="text-primary-text text-sm font-medium">
                            Same value
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center gap-2 ${isAbove ? "text-status-success" : "text-status-error"}`}
                        >
                          {isAbove ? (
                            <Icon
                              icon="fa-solid:arrow-circle-up"
                              className="h-4 w-4"
                              inline={true}
                            />
                          ) : (
                            <Icon
                              icon="fa-solid:arrow-alt-circle-down"
                              className="h-4 w-4"
                              inline={true}
                            />
                          )}
                          <span className="text-primary-text text-sm font-medium">
                            {isAbove ? "Above by" : "Below by"}{" "}
                            {diff.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Demand Comparison */}
                      {demandDelta !== null && (
                        <div>
                          {demandDelta === 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="bg-status-info h-2 w-2 rounded-full"></div>
                              <span className="text-primary-text text-sm">
                                Same demand
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`flex items-center gap-2 ${demandDelta > 0 ? "text-status-success" : "text-status-error"}`}
                            >
                              {demandDelta > 0 ? (
                                <Icon
                                  icon="fa-solid:arrow-circle-up"
                                  className="h-4 w-4"
                                  inline={true}
                                />
                              ) : (
                                <Icon
                                  icon="fa-solid:arrow-alt-circle-down"
                                  className="h-4 w-4"
                                  inline={true}
                                />
                              )}
                              <span className="text-primary-text text-sm">
                                {Math.abs(demandDelta)} level
                                {Math.abs(demandDelta) === 1 ? "" : "s"}{" "}
                                {demandDelta > 0 ? "higher" : "lower"}
                                {baselineDemand
                                  ? ` than ${baselineDemand}`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TotalSimilarItems;
