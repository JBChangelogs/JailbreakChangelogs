"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { useCatalogValues, type CatalogValues } from "@/hooks/usePartialItems";
import OGItemCard from "./OGItemCard";
import { Item } from "@/types";

import React from "react";

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  item_id: number;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  user_id: string;
  logged_at: number;
  history?: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGItemsGridProps {
  filteredItems: OGItem[];
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
  onCardClick: (item: OGItem) => void;
  isLoading?: boolean;
  itemCounts?: Map<string, number>;
  duplicateOrders?: Map<string, number>;
  items?: Item[];
}

export default function OGItemsGrid({
  filteredItems,
  getUsername,
  getUserAvatar,
  getHasVerifiedBadge,
  onCardClick,
  isLoading = false,
  itemCounts = new Map(),
  duplicateOrders = new Map(),
  items = [],
}: OGItemsGridProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 16;

  // Catalog metadata is keyed by catalog item ID, separate from the physical copy ID.
  const itemsMap = useMemo(() => {
    const map = new Map<number, Item>();
    items.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [items]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const itemQuery = useCatalogValues();
  const pageItemsMap = useMemo(() => {
    const map = new Map<number, CatalogValues>(itemsMap);
    itemQuery.data?.forEach((item) => map.set(item.id, item));
    return map;
  }, [itemsMap, itemQuery.data]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  if (
    isLoading ||
    (displayedItems.some(
      (item) => !items.some((data) => data.id === item.item_id),
    ) &&
      itemQuery.isPending)
  ) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
              <div className="flex items-start gap-4">
                <div className="bg-surface-bg h-16 w-16 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-surface-bg h-4 w-3/4 rounded"></div>
                  <div className="bg-surface-bg h-3 w-1/2 rounded"></div>
                  <div className="bg-surface-bg h-3 w-1/3 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary-text">
          No items found matching your criteria.
        </p>
      </div>
    );
  }

  if (itemQuery.isError && !itemQuery.data) {
    return (
      <div className="text-secondary-text py-8 text-center">
        Couldn&apos;t load item details.{" "}
        <button
          type="button"
          className="text-link underline"
          onClick={() => void itemQuery.refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {totalPages > 1 && (
        <div className="mb-4 flex justify-center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {displayedItems.map((item, index) => {
          const itemKey = `${item.categoryTitle}-${item.title}`;
          const duplicateCount = itemCounts.get(itemKey) || 1;
          const uniqueKey = `${item.id}-${item.user_id}-${item.logged_at}`;
          const duplicateOrder = duplicateOrders.get(uniqueKey) || 1;

          const itemData = pageItemsMap.get(item.item_id);

          return (
            <React.Fragment
              key={`${item.id}-${item.user_id}-${item.timesTraded}-${item.uniqueCirculation}-${index}`}
            >
              <OGItemCard
                item={item}
                itemData={itemData}
                getUsername={getUsername}
                getUserAvatar={getUserAvatar}
                getHasVerifiedBadge={getHasVerifiedBadge}
                onCardClick={onCardClick}
                duplicateCount={duplicateCount}
                duplicateOrder={duplicateOrder}
              />
            </React.Fragment>
          );
        })}
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
