"use client";

import { useMemo, useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { useCatalogValues } from "@/hooks/usePartialItems";
import InventoryItemCard from "./InventoryItemCard";
import InventoryItemsSkeleton from "./InventoryItemsSkeleton";
import { Item } from "@/types";
import { InventoryItem } from "@/app/inventories/types";

import React from "react";

interface InventoryItemsGridProps {
  filteredItems: Array<{
    item: InventoryItem;
    itemData?: Item;
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
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const itemQuery = useCatalogValues();
  const catalogValuesById = useMemo(
    () => new Map(itemQuery.data?.map((item) => [item.id, item])),
    [itemQuery.data],
  );

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  if (
    isLoading ||
    (displayedItems.some(({ itemData }) => !itemData) && itemQuery.isPending)
  ) {
    return <InventoryItemsSkeleton />;
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
        {displayedItems.map(({ item, itemData, isDupedItem }, index) => {
          const currentItemData =
            catalogValuesById.get(item.item_id) ?? itemData;
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
                itemData={currentItemData}
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
            page={currentPage}
            onChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
