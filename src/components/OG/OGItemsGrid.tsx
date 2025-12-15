"use client";

import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import OGItemCard from "./OGItemCard";
import { Item } from "@/types";

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
  "use memo";
  const parentRef = useRef<HTMLDivElement>(null);

  // Create items map for quick lookup - map by type and name since OG items use instance IDs
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    items.forEach((item) => {
      const key = `${item.type}-${item.name}`;
      map.set(key, item);
    });
    return map;
  }, [items]);

  // Organize items into rows for grid virtualization
  // Each row contains multiple items based on screen size
  const getItemsPerRow = () => {
    if (typeof window === "undefined") return 4; // Default for SSR
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 2;
    return 4;
  };

  const itemsPerRow = getItemsPerRow();
  const rows = (() => {
    const rowArray: OGItem[][] = [];
    for (let i = 0; i < filteredItems.length; i += itemsPerRow) {
      rowArray.push(filteredItems.slice(i, i + itemsPerRow));
    }
    return rowArray;
  })();

  // TanStack Virtual setup for performance with large item datasets
  // Only renders visible rows (~10-15 at a time) for 60FPS scrolling

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimate height for each row
    overscan: 2, // Render 2 extra rows above/below viewport for smooth scrolling
  });

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
                {rowItems.map((item, index) => {
                  const itemKey = `${item.categoryTitle}-${item.title}`;
                  const duplicateCount = itemCounts.get(itemKey) || 1;
                  const uniqueKey = `${item.id}-${item.user_id}-${item.logged_at}`;
                  const duplicateOrder = duplicateOrders.get(uniqueKey) || 1;

                  // Lookup item metadata by type and name
                  const itemData = itemsMap.get(itemKey);

                  return (
                    <OGItemCard
                      key={`${item.id}-${item.user_id}-${item.timesTraded}-${item.uniqueCirculation}-${index}`}
                      item={item}
                      itemData={itemData}
                      getUsername={getUsername}
                      getUserAvatar={getUserAvatar}
                      getHasVerifiedBadge={getHasVerifiedBadge}
                      onCardClick={onCardClick}
                      duplicateCount={duplicateCount}
                      duplicateOrder={duplicateOrder}
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
