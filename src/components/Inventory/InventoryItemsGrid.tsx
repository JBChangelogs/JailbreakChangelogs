"use client";

import { useRef, useMemo, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import InventoryItemCard from "./InventoryItemCard";
import { Item } from "@/types";
import { InventoryItem } from "@/app/inventories/types";

interface InventoryItemsGridProps {
  filteredItems: Array<{
    item: InventoryItem;
    itemData: Item;
  }>;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
  onCardClick: (item: InventoryItem) => void;
  isLoading?: boolean;
  userId: string;
  itemCounts?: Map<string, number>;
  duplicateOrders?: Map<string, number>;
  onVisibleUserIdsChange?: (userIds: string[]) => void;
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
  onVisibleUserIdsChange,
}: InventoryItemsGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const previousUserIdsRef = useRef<string>("");

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
    const rowArray: Array<{ item: InventoryItem; itemData: Item }>[] = [];
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
      if (rowItems) {
        rowItems.forEach(({ item }) => {
          // Extract user IDs from this specific item
          // Look for original owner in the item info
          const originalOwnerInfo = item.info.find(
            (info: { title: string; value: string }) =>
              info.title === "Original Owner",
          );
          if (originalOwnerInfo && originalOwnerInfo.value) {
            userIds.add(originalOwnerInfo.value);
          }
        });
      }
    });

    return Array.from(userIds).sort(); // Sort for consistent comparison
  }, [virtualItems, rows]);

  // Notify parent component when visible user IDs change
  useEffect(() => {
    if (onVisibleUserIdsChange) {
      const currentUserIdsKey = visibleUserIds.join(",");

      // Only call the callback if the user IDs have actually changed
      if (currentUserIdsKey !== previousUserIdsRef.current) {
        previousUserIdsRef.current = currentUserIdsKey;
        onVisibleUserIdsChange(visibleUserIds);
      }
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
                {rowItems.map(({ item, itemData }) => {
                  const itemKey = `${item.categoryTitle}-${item.title}`;
                  const duplicateCount = itemCounts.get(itemKey) || 1;
                  const uniqueKey = `${item.id}-${item.timesTraded}-${item.uniqueCirculation}`;
                  const duplicateOrder = duplicateOrders.get(uniqueKey) || 1;

                  return (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      itemData={itemData}
                      getUserDisplay={getUserDisplay}
                      getUserAvatar={getUserAvatar}
                      getHasVerifiedBadge={getHasVerifiedBadge}
                      onCardClick={onCardClick}
                      duplicateCount={duplicateCount}
                      duplicateOrder={duplicateOrder}
                      userId={userId}
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
