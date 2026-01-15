"use client";

import { useRef } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DuplicatedItem } from "@/utils/api";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";

interface MostDuplicatedItemsProps {
  items: DuplicatedItem[];
}

export default function MostDuplicatedItems({
  items,
}: MostDuplicatedItemsProps) {
  "use no memo";
  const parentRef = useRef<HTMLDivElement>(null);

  // Show only top 10 items
  const topItems = items && items.length > 0 ? items.slice(0, 10) : [];

  // TanStack Virtual setup for performance with large datasets
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: topItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow mb-6 rounded-lg border p-6">
        <h2 className="text-primary-text mb-4 text-xl font-semibold">
          Top 10 Most Tracked Item Duplicates
        </h2>

        {/* All Duplicate Items - Virtualized Scrollable */}
        {topItems.length > 0 && (
          <div
            ref={parentRef}
            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-96 overflow-y-auto pr-2"
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
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = topItems[virtualItem.index];
                const rank = virtualItem.index + 1;
                const categoryColor = getCategoryColor(item.type);

                return (
                  <div
                    key={`${item.name}-${item.type}-${virtualItem.index}`}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="border-border-primary bg-tertiary-bg flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="text-primary-text w-6 shrink-0 text-sm font-bold">
                        #{rank}
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <Link
                          href={`/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`}
                          prefetch={false}
                          className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors"
                        >
                          {item.name}
                        </Link>
                        <span
                          className="text-primary-text flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                          style={{
                            borderColor: categoryColor,
                            backgroundColor: categoryColor + "20",
                          }}
                        >
                          {(() => {
                            const categoryIcon = getCategoryIcon(item.type);
                            return categoryIcon ? (
                              <categoryIcon.Icon
                                className="h-3 w-3"
                                style={{
                                  color: categoryColor,
                                }}
                              />
                            ) : null;
                          })()}
                          {item.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-primary-text ml-2 text-sm font-bold whitespace-nowrap">
                      {item.count}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
