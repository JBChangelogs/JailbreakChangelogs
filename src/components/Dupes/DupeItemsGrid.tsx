"use client";

import { useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import DupeItemCard from "./DupeItemCard";
import { DupeFinderItem, Item } from "@/types";

interface DupeItemsGridProps {
  filteredItems: DupeFinderItem[];
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
  getDupedValueForItem: (itemData: Item, dupeItem: DupeFinderItem) => number;
  onCardClick: (item: DupeFinderItem) => void;
  isLoading?: boolean;
  itemCounts: Map<string, number>;
  duplicateOrders: Map<string, number>;
  itemsData: Item[];
  onVisibleUserIdsChange?: (userIds: string[]) => void;
}

export default function DupeItemsGrid({
  filteredItems,
  getUserDisplay,
  getUserAvatar,
  getHasVerifiedBadge,
  getDupedValueForItem,
  onCardClick,
  isLoading = false,
  itemCounts,
  duplicateOrders,
  itemsData,
  onVisibleUserIdsChange,
}: DupeItemsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Organize items into rows for grid virtualization
  // Each row contains multiple items based on screen size
  const getItemsPerRow = () => {
    if (typeof window === "undefined") return 4; // Default for SSR
    const width = window.innerWidth;
    if (width < 375) return 1;
    if (width < 768) return 2;
    if (width < 1024) return 2;
    if (width < 1280) return 2;
    return 4;
  };

  const itemsPerRow = getItemsPerRow();
  const rows = useMemo(() => {
    const rowArray: DupeFinderItem[][] = [];
    for (let i = 0; i < filteredItems.length; i += itemsPerRow) {
      rowArray.push(filteredItems.slice(i, i + itemsPerRow));
    }
    return rowArray;
  }, [filteredItems, itemsPerRow]);

  // TanStack Virtual setup for performance with large item datasets
  // Only renders visible rows (~10-15 at a time) for 60FPS scrolling
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimate height for each row
    overscan: 2, // Render 2 extra rows above/below viewport for smooth scrolling
  });

  // Extract user IDs from ONLY the visible items
  const virtualItems = virtualizer.getVirtualItems();
  const visibleUserIds = useMemo(() => {
    const userIds = new Set<string>();

    virtualItems.forEach((virtualRow) => {
      const rowItems = rows[virtualRow.index];
      rowItems.forEach((item) => {
        // Extract user IDs from this specific item
        if (item.latest_owner && /^\d+$/.test(item.latest_owner)) {
          userIds.add(item.latest_owner);
        }
      });
    });

    return Array.from(userIds);
  }, [virtualItems, rows]);

  // Notify parent component when visible user IDs change
  useEffect(() => {
    if (onVisibleUserIdsChange) {
      onVisibleUserIdsChange(visibleUserIds);
    }
  }, [visibleUserIds, onVisibleUserIdsChange]);

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
    <div
      ref={parentRef}
      className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus h-[60rem] overflow-auto" // Fixed height container for virtualization with custom scrollbar
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "var(--color-border-primary) transparent",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowItems = rows[virtualRow.index];
          const rowIndex = virtualRow.index;

          return (
            <div
              key={`row-${rowIndex}`}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="mb-4 grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                }}
              >
                {rowItems.map((item) => {
                  const itemData = itemsData.find(
                    (data) => data.id === item.item_id,
                  );
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
                      getHasVerifiedBadge={getHasVerifiedBadge}
                      getDupedValueForItem={getDupedValueForItem}
                      onCardClick={onCardClick}
                      duplicateNumber={duplicateNumber}
                      isDuplicate={isDuplicate}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
