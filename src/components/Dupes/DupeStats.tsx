"use client";

import { Icon } from "@/components/ui/IconWrapper";
import { DupeFinderItem } from "@/types";

interface DupeStatsProps {
  initialData: DupeFinderItem[];
  totalDupedValue: number;
  isLoadingValues: boolean;
}

// Helper function to format money with precise values
const formatPreciseMoney = (money: number) => {
  if (money >= 1000000000) {
    const value = Math.floor(money / 100000000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}B`;
  } else if (money >= 1000000) {
    const value = Math.floor(money / 100000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`;
  } else if (money >= 1000) {
    const value = Math.floor(money / 100) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}K`;
  }
  return `$${money.toLocaleString()}`;
};

export default function DupeStats({
  initialData,
  totalDupedValue,
  isLoadingValues,
}: DupeStatsProps) {
  // Calculate duplicate statistics
  const duplicateStats = (() => {
    const itemCounts = new Map<string, number>();
    const duplicateItems = new Set<string>();

    initialData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      const count = itemCounts.get(key) || 0;
      itemCounts.set(key, count + 1);

      if (count > 0) {
        duplicateItems.add(key);
      }
    });

    const totalItems = initialData.length;
    const uniqueItems = itemCounts.size;
    const duplicateCount = duplicateItems.size;
    const totalDuplicates = totalItems - uniqueItems;

    return {
      totalItems,
      uniqueItems,
      duplicateCount,
      totalDuplicates,
    };
  })();

  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        Duplicate Statistics
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Items */}
        <div className="border-border-primary bg-tertiary-bg rounded-lg border p-4">
          <p className="text-secondary-text text-sm">Total Items</p>
          <p className="text-primary-text text-2xl font-bold">
            {duplicateStats.totalItems}
          </p>
        </div>

        {/* Unique Items */}
        <div className="border-border-primary bg-tertiary-bg rounded-lg border p-4">
          <p className="text-secondary-text text-sm">Unique Items</p>
          <p className="text-primary-text text-2xl font-bold">
            {duplicateStats.uniqueItems}
          </p>
        </div>

        {/* Duplicate Items */}
        <div className="border-border-primary bg-tertiary-bg rounded-lg border p-4">
          <p className="text-secondary-text text-sm">Duplicate Items</p>
          <p className="text-primary-text text-2xl font-bold">
            {duplicateStats.duplicateCount}
          </p>
        </div>

        {/* Total Duplicates */}
        <div className="border-border-primary bg-tertiary-bg rounded-lg border p-4">
          <p className="text-secondary-text text-sm">Total Duplicates</p>
          <p className="text-primary-text text-2xl font-bold">
            {duplicateStats.totalDuplicates}
          </p>
        </div>
      </div>

      {/* Dupe Value */}
      <div className="border-border-primary bg-tertiary-bg mt-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary-text text-sm">Total Dupe Value</p>
            <p className="text-primary-text text-2xl font-bold">
              {isLoadingValues ? (
                <div className="h-8 w-24 animate-pulse rounded"></div>
              ) : (
                <>
                  <span className="sm:hidden">
                    {formatPreciseMoney(totalDupedValue)}
                  </span>
                  <span className="hidden sm:inline">
                    ${totalDupedValue.toLocaleString()}
                  </span>
                </>
              )}
            </p>
          </div>
          {duplicateStats.totalDuplicates > 0 && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Icon icon="heroicons:exclamation-triangle" className="h-5 w-5" />
              <span className="text-sm font-medium">Duplicates Found</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning Message */}
      {duplicateStats.totalDuplicates > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-900/20 p-4">
          <div className="flex items-start gap-3">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400"
            />
            <div>
              <h3 className="font-medium text-yellow-400">
                Duplicates Detected
              </h3>
              <p className="mt-1 text-sm text-yellow-300">
                This user has {duplicateStats.totalDuplicates} duplicate items
                worth{" "}
                <span className="sm:hidden">
                  {formatPreciseMoney(totalDupedValue)}
                </span>
                <span className="hidden sm:inline">
                  ${totalDupedValue.toLocaleString()}
                </span>
                . Duplicates are items that exist multiple times in the same
                inventory.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
