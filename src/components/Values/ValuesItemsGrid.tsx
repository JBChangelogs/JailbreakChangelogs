"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Pagination } from "@/components/ui/Pagination";
import ItemCard from "@/components/Items/ItemCard";
import ItemCardSkeleton from "@/components/Items/ItemCardSkeleton";
import { Item, FilterSort } from "@/types";
import { fetchFurniturePlacementLimits } from "@/utils/items/furniturePlacementLimits";
import NitroGridAd from "@/components/Ads/NitroGridAd";
import NitroValuesTopAd from "@/components/Ads/NitroValuesTopAd";
import React from "react";
import { Button } from "../ui/button";
import {
  getCatalogItemType,
  getFilterSortsDisplayNames,
} from "./valuesFilterOptions";

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
  totalPages: number;
  pageSize: number;
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
  totalPages,
  pageSize,
  valueSort,
  debouncedSearchTerm,
}: ValuesItemsGridProps) {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [placementLimitsMap, setPlacementLimitsMap] = useState<Map<
    number,
    number
  > | null>(null);

  useEffect(() => {
    fetchFurniturePlacementLimits()
      .then(setPlacementLimitsMap)
      .catch(() => {});
  }, []);

  const filterSortKey = selectedFilterSorts.join(",");

  const filterKey = JSON.stringify({
    filterSortKey,
    valueSort,
    debouncedSearchTerm,
    appliedMinValue,
    appliedMaxValue,
  });
  const previousFilterKey = useRef(filterKey);

  useEffect(() => {
    if (previousFilterKey.current === filterKey) return;
    previousFilterKey.current = filterKey;
    void setPage(1);
  }, [filterKey, setPage]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const displayedItems = items;

  useEffect(() => {
    if (page < 1) void setPage(1);
    else if (totalPages > 0 && page > totalPages) void setPage(totalPages);
  }, [page, setPage, totalPages]);

  const hasCategoryActive = selectedFilterSorts.length > 0;
  const hasLocalFilters =
    selectedFilterSorts.filter((filter) => getCatalogItemType(filter)).length >
      1 || selectedFilterSorts.some((filter) => !getCatalogItemType(filter));
  const categoryNames = getFilterSortsDisplayNames(selectedFilterSorts);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    void setPage(value);
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
    return getNoItemsMessage();
  };

  const getEmptyStateDescription = () => {
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

            if (hasLocalFilters) {
              return `Showing ${displayedItems.length} items on this page after local filters (${totalItemsCount} before those filters)`;
            }

            if (debouncedSearchTerm) {
              return `Found ${totalItemsCount} ${
                totalItemsCount === 1 ? "item" : "items"
              } matching "${debouncedSearchTerm}"${rangeText}${
                hasCategoryActive ? ` in ${categoryNames}` : ""
              }`;
            }

            if (hasCategoryActive) {
              return `${totalItemsCount} items${rangeText} in ${categoryNames}`;
            }

            return `Total Items: ${totalItemsCount}${rangeText}`;
          })()}
        </p>

        <NitroValuesTopAd />

        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedItems.length === 0 && isLoading ? (
          [...Array(pageSize)].map((_, index) => (
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
              {(appliedMinValue > 0 || appliedMaxValue < MAX_VALUE_RANGE) && (
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
            page={currentPage}
            onChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
