"use client";

import { useState, useMemo } from "react";
import { Pagination } from "@mui/material";
import OGItemCard from "./OGItemCard";
import { Item } from "@/types";
import NitroGridAd from "@/components/Ads/NitroGridAd";
import React from "react";

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
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

  // Create items map for quick lookup - map by type and name since OG items use instance IDs
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    items.forEach((item) => {
      const key = `${item.type}-${item.name}`;
      map.set(key, item);
    });
    return map;
  }, [items]);

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
          const itemKey = `${item.categoryTitle}-${item.title}`;
          const duplicateCount = itemCounts.get(itemKey) || 1;
          const uniqueKey = `${item.id}-${item.user_id}-${item.logged_at}`;
          const duplicateOrder = duplicateOrders.get(uniqueKey) || 1;

          // Lookup item metadata by type and name
          const itemData = itemsMap.get(itemKey);

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
              {(index + 1) % 4 === 0 && (
                <div className="col-span-full md:hidden flex justify-center py-4">
                  <NitroGridAd adId={`np-og-grid-${page}-${index}`} />
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
