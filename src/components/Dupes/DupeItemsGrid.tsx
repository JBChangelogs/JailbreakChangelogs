"use client";

import { useState } from "react";
import InventoryItemsSkeleton from "@/components/Inventory/InventoryItemsSkeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useCatalogValues, type CatalogValues } from "@/hooks/usePartialItems";
import DupeItemCard from "./DupeItemCard";
import { DupeFinderItem, Item } from "@/types";

import React from "react";

interface DupeItemsGridProps {
  filteredItems: DupeFinderItem[];
  getUserAvatar: (userId: string) => string;
  getUsername: (userId: string) => string;
  onCardClick: (item: DupeFinderItem) => void;
  onReport: (item: DupeFinderItem) => void;
  isLoading?: boolean;
  itemCounts: Map<string, number>;
  duplicateOrders: Map<string, number>;
  itemsData: Item[];
  robloxId: string;
}

export default function DupeItemsGrid({
  filteredItems,
  getUserAvatar,
  getUsername,
  onCardClick,
  onReport,
  isLoading = false,
  itemCounts,
  duplicateOrders,
  itemsData,
  robloxId,
}: DupeItemsGridProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 16;

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const itemQuery = useCatalogValues();
  const pageItems: CatalogValues[] = itemQuery.data ?? itemsData;

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  if (
    isLoading ||
    (displayedItems.some(
      (item) => !itemsData.some((data) => data.id === item.item_id),
    ) &&
      itemQuery.isPending)
  ) {
    return <InventoryItemsSkeleton variant="dupes" />;
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
        <span>Couldn&apos;t load item details. </span>
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
        {displayedItems.map((item) => {
          const itemData = pageItems.find((data) => data.id === item.item_id);
          if (!itemData) return null;

          const itemKey = `${item.categoryTitle}-${item.title}`;
          const isDuplicate = (itemCounts.get(itemKey) || 0) > 1;
          const duplicateNumber = isDuplicate
            ? duplicateOrders.get(item.id)
            : undefined;

          return (
            <React.Fragment key={item.id}>
              <DupeItemCard
                item={item}
                itemData={itemData}
                getUserAvatar={getUserAvatar}
                getUsername={getUsername}
                onCardClick={onCardClick}
                onReport={onReport}
                duplicateNumber={duplicateNumber}
                isDuplicate={isDuplicate}
                robloxId={robloxId}
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
