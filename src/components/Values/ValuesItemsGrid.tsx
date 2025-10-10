"use client";

import { useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import ItemCard from "@/components/Items/ItemCard";
import { Item } from "@/types";
import { getEffectiveCashValue } from "@/utils/values";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { getCurrentUserPremiumType } from "@/contexts/AuthContext";
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
  const [currentUserPremiumType, setCurrentUserPremiumType] =
    useState<number>(0);
  const [premiumStatusLoaded, setPremiumStatusLoaded] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user's premium type
    setCurrentUserPremiumType(getCurrentUserPremiumType());
    setPremiumStatusLoaded(true);

    // Listen for auth changes
    const handleAuthChange = () => {
      setCurrentUserPremiumType(getCurrentUserPremiumType());
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

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
    if (width < 1280) return 3;
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
      <style jsx>{`
        .responsive-ad-container-values {
          width: 320px;
          height: 100px;
          border: 1px solid
            var(--color-border-border-primary hover: border-border-focus);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        @media (min-width: 500px) {
          .responsive-ad-container-values {
            width: 468px;
            height: 60px;
          }
        }

        @media (min-width: 800px) {
          .responsive-ad-container-values {
            width: 728px;
            height: 90px;
          }
        }
      `}</style>
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
              const globalIndex = rowIndex * itemsPerRow;

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
                  <div className="grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
                    {rowItems.map((item: Item, itemIndex: number) => {
                      const absoluteIndex = globalIndex + itemIndex;
                      return (
                        <React.Fragment key={item.id}>
                          <ItemCard
                            item={item}
                            isFavorited={favorites.includes(item.id)}
                            onFavoriteChange={(fav) => {
                              onFavoriteChange(item.id, fav);
                            }}
                          />
                          {/* Show in-feed ad after every 12 items */}
                          {premiumStatusLoaded &&
                            currentUserPremiumType === 0 &&
                            (absoluteIndex + 1) % 12 === 0 &&
                            absoluteIndex + 1 < rangeFilteredItems.length && (
                              <div className="col-span-full my-4 flex justify-center">
                                <div className="w-full max-w-[700px]">
                                  <span className="text-secondary-text mb-2 block text-center text-xs">
                                    ADVERTISEMENT
                                  </span>
                                  <div className="responsive-ad-container-values">
                                    <DisplayAd
                                      adSlot="4358721799"
                                      adFormat="fluid"
                                      layoutKey="-62+ck+1k-2e+cb"
                                      style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                      }}
                                    />
                                  </div>
                                  <AdRemovalNotice />
                                </div>
                              </div>
                            )}
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
