"use client";

import Link from "next/link";
import { DuplicatedItem } from "@/utils/api";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";

interface MostDuplicatedItemsProps {
  items: DuplicatedItem[];
}

export default function MostDuplicatedItems({
  items,
}: MostDuplicatedItemsProps) {
  "use no memo";

  // Show only top 10 items
  const topItems = items && items.length > 0 ? items.slice(0, 10) : [];

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
        <h2 className="text-primary-text mb-4 text-xl font-semibold">
          Top 10 Most Tracked Item Duplicates
        </h2>

        {/* Top 10 Duplicate Items */}
        {topItems.length > 0 && (
          <div className="flex flex-col gap-3">
            {topItems.map((item, index) => {
              const rank = index + 1;
              const categoryColor = getCategoryColor(item.type);

              return (
                <div
                  key={`${item.name}-${item.type}-${index}`}
                  className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-3"
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
                        className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                        style={{
                          borderColor: categoryColor,
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
        )}
      </div>
    </div>
  );
}
