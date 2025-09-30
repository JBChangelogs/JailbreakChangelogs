"use client";

import { Pagination } from "@mui/material";
import DupeItemCard from "./DupeItemCard";
import { DupeFinderItem, Item } from "@/types";

interface DupeItemsGridProps {
  paginatedData: DupeFinderItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getDupedValueForItem: (itemData: Item, dupeItem: DupeFinderItem) => number;
  onCardClick: (item: DupeFinderItem) => void;
  itemCounts: Map<string, number>;
  duplicateOrders: Map<string, number>;
  itemsData: Item[];
}

export default function DupeItemsGrid({
  paginatedData,
  currentPage,
  totalPages,
  onPageChange,
  getUserDisplay,
  getUserAvatar,
  getDupedValueForItem,
  onCardClick,
  itemCounts,
  duplicateOrders,
  itemsData,
}: DupeItemsGridProps) {
  if (paginatedData.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary-text">
          No items found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedData.map((item) => {
          const itemData = itemsData.find((data) => data.id === item.item_id);
          if (!itemData) return null;

          const itemKey = `${item.categoryTitle}-${item.title}`;
          const isDuplicate = (itemCounts.get(itemKey) || 0) > 1;
          const duplicateNumber = isDuplicate
            ? duplicateOrders.get(item.id)
            : undefined;

          return (
            <DupeItemCard
              key={item.id}
              item={item}
              itemData={itemData}
              getUserDisplay={getUserDisplay}
              getUserAvatar={getUserAvatar}
              getDupedValueForItem={getDupedValueForItem}
              onCardClick={onCardClick}
              duplicateNumber={duplicateNumber}
              isDuplicate={isDuplicate}
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
    </div>
  );
}
