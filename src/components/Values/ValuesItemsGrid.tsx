"use client";

import { useState, useMemo, useEffect } from "react";
import { Pagination } from "@/components/ui/Pagination";
import ItemCard from "@/components/Items/ItemCard";
import ItemCardSkeleton from "@/components/Items/ItemCardSkeleton";
import { Item, FilterSort } from "@/types";
import { getEffectiveCashValue } from "@/utils/trading/values";
import {
  fetchItemUnlockMetadataById,
  ItemUnlockMetadataEntry,
} from "@/utils/items/itemUnlockMetadata";
import { fetchFurniturePlacementLimits } from "@/utils/items/furniturePlacementLimits";
import NitroGridAd from "@/components/Ads/NitroGridAd";
import NitroValuesTopAd from "@/components/Ads/NitroValuesTopAd";
import React from "react";
import { Button } from "../ui/button";
import { getFilterSortsDisplayNames } from "./valuesFilterOptions";

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

interface ValuesItemsGridProps {
  items: Item[];
  isLoading?: boolean;
  favorites: number[];
  onFavoriteChange: (itemId: number, isFavorited: boolean) => void;
  appliedMinValue: number;
  appliedMaxValue: number;
  MAX_VALUE_RANGE: number;
  onResetValueRange: () => void;
  onClearAllFilters: () => void;
  onClearCategoryFilter: () => void;
  selectedFilterSorts: FilterSort[];
  totalItemsCount: number;
  valueSort: string;
  debouncedSearchTerm: string;
}

export default function ValuesItemsGrid({
  items,
  isLoading = false,
  favorites,
  onFavoriteChange,
  appliedMinValue,
  appliedMaxValue,
  MAX_VALUE_RANGE,
  onResetValueRange,
  onClearAllFilters,
  onClearCategoryFilter,
  selectedFilterSorts,
  totalItemsCount,
  valueSort,
  debouncedSearchTerm,
}: ValuesItemsGridProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 32;
  const [metadataMap, setMetadataMap] = useState<Map<
    number,
    ItemUnlockMetadataEntry
  > | null>(null);
  const [placementLimitsMap, setPlacementLimitsMap] = useState<Map<
    number,
    number
  > | null>(null);

  useEffect(() => {
    fetchItemUnlockMetadataById()
      .then(setMetadataMap)
      .catch(() => {});
    fetchFurniturePlacementLimits()
      .then(setPlacementLimitsMap)
      .catch(() => {});
  }, []);

  const filterSortKey = selectedFilterSorts.join(",");

  // State derivation to reset page when filters change
  const [prevFilters, setPrevFilters] = useState({
    filterSortKey,
    valueSort,
    debouncedSearchTerm,
    appliedMinValue,
    appliedMaxValue,
  });

  if (
    prevFilters.filterSortKey !== filterSortKey ||
    prevFilters.valueSort !== valueSort ||
    prevFilters.debouncedSearchTerm !== debouncedSearchTerm ||
    prevFilters.appliedMinValue !== appliedMinValue ||
    prevFilters.appliedMaxValue !== appliedMaxValue
  ) {
    setPrevFilters({
      filterSortKey,
      valueSort,
      debouncedSearchTerm,
      appliedMinValue,
      appliedMaxValue,
    });
    setPage(1);
  }

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const rangeFilteredItems = useMemo(() => {
    if (appliedMinValue === 0 && appliedMaxValue >= MAX_VALUE_RANGE)
      return items;
    return items.filter((item) => {
      const cash = parseNumericValue(getEffectiveCashValue(item));
      const isOpenEndedMax = appliedMaxValue >= MAX_VALUE_RANGE;
      if (isOpenEndedMax) return cash >= appliedMinValue;
      return cash >= appliedMinValue && cash <= appliedMaxValue;
    });
  }, [items, appliedMinValue, appliedMaxValue, MAX_VALUE_RANGE]);

  const totalPages = Math.ceil(rangeFilteredItems.length / itemsPerPage);
  const displayedItems = rangeFilteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const hasCategoryActive = selectedFilterSorts.length > 0;
  const categoryNames = getFilterSortsDisplayNames(selectedFilterSorts);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const getNoItemsMessage = () => {
    const hasCategoryFilter = hasCategoryActive;
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
      const categoryName = categoryNames;
      const demandLevel = valueSort.replace("demand-", "").replace(/-/g, " ");
      const formattedDemand = demandLevel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      message += ` in ${categoryName} with ${formattedDemand} demand`;
    } else if (hasCategoryFilter && hasTrendFilter) {
      const categoryName = categoryNames;
      const trendLevel = valueSort.replace("trend-", "").replace(/-/g, " ");
      const formattedTrend = trendLevel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      message += ` in ${categoryName} with ${formattedTrend} trend`;
    } else if (hasCategoryFilter) {
      const categoryName = categoryNames;
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

  const getEmptyStateTitle = () => {
    if (rangeFilteredItems.length === 0 && items.length > 0) {
      return "No results";
    }

    return getNoItemsMessage();
  };

  const getEmptyStateDescription = () => {
    if (rangeFilteredItems.length === 0 && items.length > 0) {
      return `No items found in the selected value range (${appliedMinValue.toLocaleString()} - ${
        appliedMaxValue >= MAX_VALUE_RANGE
          ? `${MAX_VALUE_RANGE.toLocaleString()}+`
          : appliedMaxValue.toLocaleString()
      })`;
    }

    return "Try adjusting your search or filter.";
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <p className="text-secondary-text">
          {(() => {
            const isDefaultRange =
              appliedMinValue === 0 && appliedMaxValue >= MAX_VALUE_RANGE;
            const rangeText = !isDefaultRange
              ? ` in range ${appliedMinValue.toLocaleString()} - ${
                  appliedMaxValue >= MAX_VALUE_RANGE
                    ? `${MAX_VALUE_RANGE.toLocaleString()}+`
                    : appliedMaxValue.toLocaleString()
                }`
              : "";

            if (debouncedSearchTerm) {
              return `Found ${rangeFilteredItems.length} ${
                rangeFilteredItems.length === 1 ? "item" : "items"
              } matching "${debouncedSearchTerm}"${rangeText}${
                hasCategoryActive ? ` in ${categoryNames}` : ""
              }`;
            }

            if (hasCategoryActive) {
              return `${rangeFilteredItems.length} of ${totalItemsCount} Items${rangeText} in ${categoryNames}`;
            }

            return `Total Items${rangeText}: ${rangeFilteredItems.length}`;
          })()}
        </p>

        <NitroValuesTopAd />

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedItems.length === 0 && isLoading ? (
          [...Array(itemsPerPage)].map((_, index) => (
            <ItemCardSkeleton key={index} />
          ))
        ) : displayedItems.length === 0 ? (
          <div className="border-border-card bg-secondary-bg col-span-full mb-4 rounded-lg border p-8 text-center">
            <h3 className="text-primary-text mb-1 font-semibold">
              {getEmptyStateTitle()}
            </h3>
            <p className="text-secondary-text text-sm">
              {getEmptyStateDescription()}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {rangeFilteredItems.length === 0 && items.length > 0 && (
                <Button onClick={onResetValueRange} variant="default">
                  Reset Value Range
                </Button>
              )}
              {debouncedSearchTerm && hasCategoryActive && (
                <Button onClick={onClearCategoryFilter} variant="secondary">
                  Search All Categories
                </Button>
              )}
              <Button onClick={onClearAllFilters} variant="default">
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          displayedItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <ItemCard
                item={item}
                isFavorited={favoritesSet.has(item.id)}
                itemMetadata={metadataMap?.get(item.id) ?? null}
                placementLimit={placementLimitsMap?.get(item.id) ?? null}
                onFavoriteChange={(fav) => {
                  onFavoriteChange(item.id, fav);
                }}
              />
              {(index + 1) % 6 === 0 && index + 1 <= 12 && (
                <div className="col-span-full flex justify-center py-4 md:hidden">
                  <NitroGridAd
                    adId={`np-value-grid-${Math.floor((index + 1) / 6)}`}
                  />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
