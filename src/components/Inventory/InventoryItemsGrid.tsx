"use client";

import { useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import InventoryItemCard from "./InventoryItemCard";
import { Item } from "@/types";
import { InventoryItem } from "@/app/inventories/types";

import React from "react";

interface InventoryItemsGridProps {
  filteredItems: Array<{
    item: InventoryItem;
    itemData: Item;
    isDupedItem?: boolean;
  }>;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
  onCardClick: (item: InventoryItem) => void;
  isLoading?: boolean;
  userId: string;
  itemCounts?: Map<string, number>;
  duplicateOrders?: Map<string, number>;
}

export default function InventoryItemsGrid({
  filteredItems,
  getUserDisplay,
  getUserAvatar,
  getHasVerifiedBadge,
  onCardClick,
  isLoading = false,
  userId,
  itemCounts = new Map(),
  duplicateOrders = new Map(),
}: InventoryItemsGridProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 16;

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  if (isLoading) {
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

  return (
    <>
      {totalPages > 1 && (
        <div className="mb-4 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {displayedItems.map(({ item, itemData, isDupedItem }, index) => {
          const itemKey = `${item.categoryTitle}-${item.title}`;
          const duplicateCount = itemCounts.get(itemKey) || 1;
          const uniqueKey = `${item.id}-${item.timesTraded}-${item.uniqueCirculation}`;
          const duplicateOrder = duplicateOrders.get(uniqueKey) || 1;

          // Create a unique key that distinguishes between duplicate items
          // Use scan_id for duplicated items, logged_at for original items, or index as fallback
          const itemWithExtras = item as InventoryItem & {
            logged_at?: number;
            is_original_item?: boolean;
          };
          const uniqueItemKey = item.scan_id
            ? `${item.id}-${item.scan_id}`
            : itemWithExtras.logged_at
              ? `${item.id}-${itemWithExtras.logged_at}`
              : `${item.id}-${index}`;

          return (
            <React.Fragment key={uniqueItemKey}>
              <InventoryItemCard
                item={item}
                itemData={itemData}
                getUserDisplay={getUserDisplay}
                getUserAvatar={getUserAvatar}
                getHasVerifiedBadge={getHasVerifiedBadge}
                onCardClick={onCardClick}
                duplicateCount={duplicateCount}
                duplicateOrder={duplicateOrder}
                userId={userId}
                isDupedItem={isDupedItem}
              />
            </React.Fragment>
          );
        })}
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
