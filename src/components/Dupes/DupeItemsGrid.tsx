"use client";

import { useState } from "react";
import { Pagination } from "@mui/material";
import DupeItemCard from "./DupeItemCard";
import { DupeFinderItem, Item } from "@/types";
import NitroGridAd from "@/components/Ads/NitroGridAd";
import React from "react";

interface DupeItemsGridProps {
  filteredItems: DupeFinderItem[];
  getUserAvatar: (userId: string) => string;
  getUsername: (userId: string) => string;
  getDupedValueForItem: (itemData: Item, dupeItem: DupeFinderItem) => number;
  onCardClick: (item: DupeFinderItem) => void;
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
  getDupedValueForItem,
  onCardClick,
  isLoading = false,
  itemCounts,
  duplicateOrders,
  itemsData,
  robloxId,
}: DupeItemsGridProps) {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="border-border-primary bg-secondary-bg rounded-lg border p-4">
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
            sx={{
              "& .MuiPaginationItem-root": {
                color: "var(--color-primary-text)",
                "&.Mui-selected": {
                  backgroundColor: "var(--color-button-info)",
                  color: "var(--color-form-button-text)",
                  "&:hover": {
                    backgroundColor: "var(--color-button-info-hover)",
                  },
                },
                "&:hover": {
                  backgroundColor: "var(--color-quaternary-bg)",
                },
              },
              "& .MuiPaginationItem-icon": {
                color: "var(--color-primary-text)",
              },
            }}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {displayedItems.map((item, index) => {
          const itemData = itemsData.find((data) => data.id === item.item_id);
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
                getDupedValueForItem={getDupedValueForItem}
                onCardClick={onCardClick}
                duplicateNumber={duplicateNumber}
                isDuplicate={isDuplicate}
                robloxId={robloxId}
              />
              {(index + 1) % 4 === 0 && (
                <div className="col-span-full md:hidden flex justify-center py-4">
                  <NitroGridAd adId={`np-dupe-grid-${page}-${index}`} />
                </div>
              )}
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
            sx={{
              "& .MuiPaginationItem-root": {
                color: "var(--color-primary-text)",
                "&.Mui-selected": {
                  backgroundColor: "var(--color-button-info)",
                  color: "var(--color-form-button-text)",
                  "&:hover": {
                    backgroundColor: "var(--color-button-info-hover)",
                  },
                },
                "&:hover": {
                  backgroundColor: "var(--color-quaternary-bg)",
                },
              },
              "& .MuiPaginationItem-icon": {
                color: "var(--color-primary-text)",
              },
            }}
          />
        </div>
      )}
    </>
  );
}
