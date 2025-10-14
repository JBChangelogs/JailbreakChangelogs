"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import ItemCard from "@/components/Items/ItemCard";
import { Item } from "@/types";
import { getEffectiveCashValue } from "@/utils/values";
import React from "react";

interface ValuesItemsGridProps {
  items: Item[];
  favorites: number[];
  onFavoriteChange: (itemId: number, isFavorited: boolean) => void;
  appliedMinValue: number;
  appliedMaxValue: number;
  MAX_VALUE_RANGE: number;
  onResetValueRange: () => void;
  onClearAllFilters: () => void;
  filterSort: string;
  valueSort: string;
  debouncedSearchTerm: string;
}

export default function ValuesItemsGrid({
  items,
  favorites,
  onFavoriteChange,
  appliedMinValue,
  appliedMaxValue,
  MAX_VALUE_RANGE,
  onResetValueRange,
  onClearAllFilters,
  filterSort,
  valueSort,
  debouncedSearchTerm,
}: ValuesItemsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const parseNumericValue = (value: string | null): number => {
    if (!value || value === "N/A") return -1;
    const lower = value.toLowerCase();
    const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(num)) return -1;
    if (lower.includes("k")) return num * 1_000;
    if (lower.includes("m")) return num * 1_000_000;
    if (lower.includes("b")) return num * 1_000_000_000;
    return num;
  };

  const rangeFilteredItems =
    appliedMinValue === 0 && appliedMaxValue >= MAX_VALUE_RANGE
      ? items
      : items.filter((item) => {
          const cash = parseNumericValue(getEffectiveCashValue(item));
          const isOpenEndedMax = appliedMaxValue >= MAX_VALUE_RANGE;
          if (isOpenEndedMax) return cash >= appliedMinValue;
          return cash >= appliedMinValue && cash <= appliedMaxValue;
        });

  // Organize items into rows for grid virtualization
  // Each row contains multiple items based on screen size
  const getItemsPerRow = () => {
    if (typeof window === "undefined") return 4; // Default for SSR
    const width = window.innerWidth;
    if (width < 375) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 2;
    if (width < 1280) return 2;
    return 4;
  };

  const itemsPerRow = getItemsPerRow();
  const rows: Item[][] = [];
  for (let i = 0; i < rangeFilteredItems.length; i += itemsPerRow) {
    rows.push(rangeFilteredItems.slice(i, i + itemsPerRow));
  }

  // TanStack Virtual setup for performance with large item datasets
  // Only renders visible rows (~10-15 at a time) for 60FPS scrolling
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Simple estimate - let TanStack measure actual content
    overscan: 2, // Render 2 extra rows above/below viewport for smooth scrolling
  });

  const getNoItemsMessage = () => {
    const hasCategoryFilter = filterSort !== "name-all-items";
    const hasDemandFilter =
      valueSort.startsWith("demand-") &&
      valueSort !== "demand-desc" &&
      valueSort !== "demand-asc";
    const hasTrendFilter =
      valueSort.startsWith("trend-") &&
      valueSort !== "trend-desc" &&
      valueSort !== "trend-asc";
    const hasSearchTerm = debouncedSearchTerm;

    let message = "No items found";

    // Build the message based on what filters are applied
    if (hasSearchTerm) {
      message += ` matching "${debouncedSearchTerm}"`;
    }

    if (hasCategoryFilter && hasDemandFilter) {
      const categoryName = filterSort
        .replace("name-", "")
        .replace("-items", "")
        .replace(/-/g, " ");
      const demandLevel = valueSort.replace("demand-", "").replace(/-/g, " ");
      const formattedDemand = demandLevel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      message += ` in ${categoryName} with ${formattedDemand} demand`;
    } else if (hasCategoryFilter && hasTrendFilter) {
      const categoryName = filterSort
        .replace("name-", "")
        .replace("-items", "")
        .replace(/-/g, " ");
      const trendLevel = valueSort.replace("trend-", "").replace(/-/g, " ");
      const formattedTrend = trendLevel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      message += ` in ${categoryName} with ${formattedTrend} trend`;
    } else if (hasCategoryFilter) {
      const categoryName = filterSort
        .replace("name-", "")
        .replace("-items", "")
        .replace(/-/g, " ");
      message += ` in ${categoryName}`;
    } else if (hasDemandFilter) {
      const demandLevel = valueSort.replace("demand-", "").replace(/-/g, " ");
      const formattedDemand = demandLevel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      message += ` with ${formattedDemand} demand`;
    } else if (hasTrendFilter) {
      const trendLevel = valueSort.replace("trend-", "").replace(/-/g, " ");
      const formattedTrend = trendLevel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      message += ` with ${formattedTrend} trend`;
    }

    return message;
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <p className="text-secondary-text">
          {debouncedSearchTerm
            ? `Found ${rangeFilteredItems.length} ${rangeFilteredItems.length === 1 ? "item" : "items"} matching "${debouncedSearchTerm}"${filterSort !== "name-all-items" ? ` in ${filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ")}` : ""}`
            : `Total ${filterSort !== "name-all-items" ? filterSort.replace("name-", "").replace("-items", "").replace(/-/g, " ") : "Items"}: ${rangeFilteredItems.length}`}
        </p>
      </div>

      {/* Virtualized items container with fixed height for performance */}
      <div ref={parentRef} className="mb-8 h-[60rem] overflow-y-auto">
        {rangeFilteredItems.length === 0 ? (
          <div className="bg-secondary-bg border-border-primary hover:border-border-focus rounded-lg border p-8 text-center">
            <p className="text-secondary-text text-lg">
              {rangeFilteredItems.length === 0 && items.length > 0
                ? `No items found in the selected value range (${appliedMinValue.toLocaleString()} - ${appliedMaxValue >= MAX_VALUE_RANGE ? `${MAX_VALUE_RANGE.toLocaleString()}+` : appliedMaxValue.toLocaleString()})`
                : getNoItemsMessage()}
            </p>
            {rangeFilteredItems.length === 0 && items.length > 0 && (
              <button
                onClick={onResetValueRange}
                className="text-form-button-text border-border-primary hover:border-border-focus bg-button-info hover:bg-button-info-hover mt-4 mr-3 rounded-lg border px-6 py-2 focus:outline-none"
              >
                Reset Value Range
              </button>
            )}
            <button
              onClick={onClearAllFilters}
              className="text-form-button-text border-border-primary hover:border-border-focus bg-button-info hover:bg-button-info-hover mt-4 rounded-lg border px-6 py-2 focus:outline-none"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowItems = rows[virtualRow.index];
              const rowIndex = virtualRow.index;

              return (
                <div
                  key={`row-${rowIndex}`}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className="mb-4 grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                    }}
                  >
                    {rowItems.map((item: Item) => {
                      return (
                        <React.Fragment key={item.id}>
                          <ItemCard
                            item={item}
                            isFavorited={favorites.includes(item.id)}
                            onFavoriteChange={(fav) => {
                              onFavoriteChange(item.id, fav);
                            }}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
