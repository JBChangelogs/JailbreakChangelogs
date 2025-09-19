"use client";

import { Pagination } from "@mui/material";
import OGItemCard from "./OGItemCard";

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
  paginatedData: OGItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  onCardClick: (item: OGItem) => void;
  itemCounts?: Map<string, number>;
  duplicateOrders?: Map<string, number>;
}

export default function OGItemsGrid({
  paginatedData,
  currentPage,
  totalPages,
  onPageChange,
  getUserDisplay,
  getUserAvatar,
  onCardClick,
  itemCounts = new Map(),
  duplicateOrders = new Map(),
}: OGItemsGridProps) {
  if (paginatedData.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted">No items found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedData.map((item, index) => {
          const itemKey = `${item.categoryTitle}-${item.title}`;
          const duplicateCount = itemCounts.get(itemKey) || 1;
          const uniqueKey = `${item.id}-${item.user_id}-${item.logged_at}`;
          const duplicateOrder = duplicateOrders.get(uniqueKey) || 1;

          return (
            <OGItemCard
              key={`${item.id}-${item.user_id}-${item.timesTraded}-${item.uniqueCirculation}-${index}`}
              item={item}
              getUserDisplay={getUserDisplay}
              getUserAvatar={getUserAvatar}
              onCardClick={onCardClick}
              duplicateCount={duplicateCount}
              duplicateOrder={duplicateOrder}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#D3D9D4",
                "&.Mui-selected": {
                  backgroundColor: "#5865F2",
                  color: "#FFFFFF",
                },
                "&:hover": {
                  backgroundColor: "#2E3944",
                },
              },
              "& .MuiPaginationItem-ellipsis": {
                color: "#D3D9D4",
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
