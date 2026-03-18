"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { UserNetworthData } from "@/utils/api";
import { Icon } from "@/components/ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Cell, Pie, PieChart } from "recharts";
import type { Item } from "@/types";
import type { InventoryData } from "@/app/inventories/types";

interface InventoryBreakdownProps {
  networthData: UserNetworthData[];
  username: string;
  itemsData: Item[];
  inventoryData: InventoryData;
}

const UNVERIFIABLE_COLLECTION_ITEM_IDS = new Set<number>([
  903, 902, 142, 145, 534, 778, 293, 152, 467, 587, 713, 653, 171, 174, 176,
  185, 187, 655, 204, 640, 634,
]);

const VALUES_TYPE_ORDER = [
  "Vehicle",
  "HyperChrome",
  "Rim",
  "Texture",
  "Spoiler",
  "Tire Style",
  "Tire Sticker",
  "Horn",
  "Body Color",
  "Drift",
  "Weapon Skin",
  "Furniture",
] as const;

const VALUES_TYPE_ORDER_RANK = new Map<string, number>(
  VALUES_TYPE_ORDER.map((type, idx) => [type.toLowerCase(), idx]),
);

export default function InventoryBreakdown({
  networthData,
  itemsData,
  inventoryData,
}: InventoryBreakdownProps) {
  // Get the latest networth data
  const latestData =
    networthData && networthData.length > 0 ? networthData[0] : null;

  // Format large numbers with commas for better readability
  const formatNetworth = (networth: number) => {
    return new Intl.NumberFormat("en-US").format(networth);
  };

  const formatInventoryCount = (count: number) => {
    return new Intl.NumberFormat("en-US").format(count);
  };

  // Truncate percentage to 2 decimal places without rounding
  const formatPercentage = (percentage: number): string => {
    const truncated = Math.floor(percentage * 100) / 100;
    return truncated.toFixed(2);
  };

  // Calculate category values using percentages and inventory_value
  const calculateCategoryValues = (): Record<string, number> => {
    if (!latestData?.percentages || !latestData.inventory_value) return {};

    const categoryValues: Record<string, number> = {};
    const totalInventoryValue = latestData.inventory_value;

    Object.entries(latestData.percentages).forEach(([category, percentage]) => {
      categoryValues[category] = (percentage / 100) * totalInventoryValue;
    });

    return categoryValues;
  };

  const categoryValues = calculateCategoryValues();
  const sortedCategoryEntries = Object.entries(
    latestData?.percentages || {},
  ).sort(([, a], [, b]) => b - a);
  const categoryChartData = sortedCategoryEntries.map(
    ([category, percentage]) => ({
      category,
      percentage,
      value: percentage,
      amount: categoryValues[category] ?? 0,
      fill: getCategoryColor(category),
    }),
  );
  const categoryChartConfig = {
    percentage: {
      label: "Category Share",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Calculate duplicate category values
  const calculateDuplicateCategoryValues = (): Record<string, number> => {
    if (!latestData?.duplicates_percentages || !latestData.duplicates_value)
      return {};

    const duplicateCategoryValues: Record<string, number> = {};

    Object.entries(latestData.duplicates_percentages).forEach(
      ([category, percentage]) => {
        duplicateCategoryValues[category] =
          (percentage / 100) * latestData.duplicates_value!;
      },
    );

    return duplicateCategoryValues;
  };

  const duplicateCategoryValues = calculateDuplicateCategoryValues();

  const ownedItemIds = useMemo(() => {
    const ids = new Set<number>();
    inventoryData.data.forEach((invItem) => ids.add(invItem.item_id));
    (inventoryData.duplicates || []).forEach((invItem) =>
      ids.add(invItem.item_id),
    );
    return ids;
  }, [inventoryData.data, inventoryData.duplicates]);

  const includeUntradable = true;
  const [missingSearch, setMissingSearch] = useState("");
  const [missingTypeFilter, setMissingTypeFilter] = useState<string>("all");
  const [unverifiableSearch, setUnverifiableSearch] = useState("");
  const [unverifiableTypeFilter, setUnverifiableTypeFilter] =
    useState<string>("all");

  const eligibleItems = useMemo(() => {
    if (includeUntradable) return itemsData;
    return itemsData.filter((item) => Boolean(item.tradable));
  }, [itemsData, includeUntradable]);

  const unverifiableSectionRef = useRef<HTMLDivElement>(null);

  const unverifiableItemsAll = useMemo(() => {
    const unverifiable = eligibleItems
      .filter((item) => UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id))
      .map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type?.trim() || "Unknown",
      }));
    unverifiable.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.type.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.type.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });
    return unverifiable;
  }, [eligibleItems]);

  const unverifiableCount = useMemo(() => {
    return eligibleItems.reduce((count, item) => {
      return UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id) ? count + 1 : count;
    }, 0);
  }, [eligibleItems]);

  const effectiveOwnedItemIds = useMemo(() => {
    const ids = new Set<number>(ownedItemIds);
    UNVERIFIABLE_COLLECTION_ITEM_IDS.forEach((id) => ids.add(id));
    return ids;
  }, [ownedItemIds]);

  const typeProgress = useMemo(() => {
    const byType = new Map<string, Item[]>();
    eligibleItems.forEach((item) => {
      const type = item.type?.trim() || "Unknown";
      const existing = byType.get(type);
      if (existing) existing.push(item);
      else byType.set(type, [item]);
    });

    const progress = Array.from(byType.entries()).map(([type, typeItems]) => {
      const ownedCount = typeItems.filter((item) => {
        return effectiveOwnedItemIds.has(item.id);
      }).length;
      const missing = typeItems
        .filter((item) => {
          if (UNVERIFIABLE_COLLECTION_ITEM_IDS.has(item.id)) return false;
          return !effectiveOwnedItemIds.has(item.id);
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      const missingCount = typeItems.length - ownedCount;
      const percentage =
        typeItems.length > 0 ? (ownedCount / typeItems.length) * 100 : 0;

      return {
        type,
        total: typeItems.length,
        owned: ownedCount,
        missing,
        missingCount,
        percentage,
      };
    });

    progress.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.owned !== a.owned) return b.owned - a.owned;
      if (b.total !== a.total) return b.total - a.total;
      return a.type.localeCompare(b.type);
    });

    return progress;
  }, [effectiveOwnedItemIds, eligibleItems]);

  const overallProgress = useMemo(() => {
    const total = eligibleItems.length;
    const owned = eligibleItems.filter((item) =>
      effectiveOwnedItemIds.has(item.id),
    ).length;
    const missingCount = total - owned;
    const percentage = total > 0 ? (owned / total) * 100 : 0;
    return { total, owned, missingCount, percentage };
  }, [effectiveOwnedItemIds, eligibleItems]);

  const missingItemsAll = useMemo(() => {
    const missing = typeProgress.flatMap((progress) =>
      progress.missing.map((item) => ({
        id: item.id,
        name: item.name,
        type: progress.type,
      })),
    );
    missing.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.type.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.type.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare !== 0) return typeCompare;
      return a.name.localeCompare(b.name);
    });
    return missing;
  }, [typeProgress]);

  const missingTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    const uniqueTypes: string[] = [];
    typeProgress.forEach((entry) => {
      if (seen.has(entry.type)) return;
      seen.add(entry.type);
      uniqueTypes.push(entry.type);
    });

    uniqueTypes.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      return a.localeCompare(b);
    });

    return uniqueTypes;
  }, [typeProgress]);

  const filteredMissingItems = useMemo(() => {
    const typeFilter = missingTypeFilter.trim().toLowerCase();
    const typeFiltered =
      typeFilter === "all"
        ? missingItemsAll
        : missingItemsAll.filter(
            (item) => item.type.toLowerCase() === typeFilter,
          );

    const query = missingSearch.trim().toLowerCase();
    if (!query) return typeFiltered;
    return typeFiltered.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [missingItemsAll, missingSearch, missingTypeFilter]);

  const unverifiableTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    const uniqueTypes: string[] = [];
    unverifiableItemsAll.forEach((entry) => {
      if (seen.has(entry.type)) return;
      seen.add(entry.type);
      uniqueTypes.push(entry.type);
    });

    uniqueTypes.sort((a, b) => {
      const aRank = VALUES_TYPE_ORDER_RANK.get(a.toLowerCase()) ?? 999;
      const bRank = VALUES_TYPE_ORDER_RANK.get(b.toLowerCase()) ?? 999;
      if (aRank !== bRank) return aRank - bRank;
      return a.localeCompare(b);
    });

    return uniqueTypes;
  }, [unverifiableItemsAll]);

  const filteredUnverifiableItems = useMemo(() => {
    const typeFilter = unverifiableTypeFilter.trim().toLowerCase();
    const typeFiltered =
      typeFilter === "all"
        ? unverifiableItemsAll
        : unverifiableItemsAll.filter(
            (item) => item.type.toLowerCase() === typeFilter,
          );

    const query = unverifiableSearch.trim().toLowerCase();
    if (!query) return typeFiltered;
    return typeFiltered.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });
  }, [unverifiableItemsAll, unverifiableSearch, unverifiableTypeFilter]);

  const scrollToUnverifiableSection = () => {
    const target = unverifiableSectionRef.current;
    if (!target) return;

    const rectTop = target.getBoundingClientRect().top;
    const absoluteTop = rectTop + window.scrollY;

    const rawHeaderHeight = getComputedStyle(
      document.documentElement,
    ).getPropertyValue("--header-height");
    const headerHeight = Number.parseFloat(rawHeaderHeight || "0") || 0;

    const extraPadding = 12;
    const top = Math.max(0, absoluteTop - headerHeight - extraPadding);
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (!latestData || !latestData.percentages) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <p className="text-secondary-text">
          No breakdown data available for this inventory.
        </p>
      </div>
    );
  }

  const { networth, inventory_count, money, inventory_value, percentages } =
    latestData;
  const duplicatesCount = latestData.duplicates_count;
  const duplicatesValue = latestData.duplicates_value;
  const duplicatesPercentages = latestData.duplicates_percentages;
  const sortedDuplicateEntries = Object.entries(
    duplicatesPercentages || {},
  ).sort(([, a], [, b]) => b - a);
  const duplicatesChartData = sortedDuplicateEntries.map(
    ([category, percentage]) => ({
      category,
      value: percentage,
      amount: duplicateCategoryValues[category] ?? 0,
      fill: getCategoryColor(category),
    }),
  );

  // Calculate total items including duplicates
  const totalItems = inventory_count + (duplicatesCount || 0);

  const collectionChartConfig = {
    value: {
      label: "Completion",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const collectionChartData = typeProgress
    .filter((entry) => entry.total > 0)
    .map((entry) => ({
      category: entry.type,
      value: entry.percentage,
      owned: entry.owned,
      total: entry.total,
      missingCount: entry.missingCount,
      percentage: entry.percentage,
      fill: getCategoryColor(entry.type),
    }));

  return (
    <div className="space-y-6">
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        <h4 className="text-primary-text mb-3 text-sm font-semibold">
          Overview
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-1 text-sm">Total Items</div>
            <div className="text-primary-text text-lg font-bold">
              {formatInventoryCount(totalItems)}
            </div>
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-1 flex items-center justify-center gap-1.5 text-sm">
              Total Networth
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon
                    icon="material-symbols:info-outline"
                    className="text-secondary-text h-4 w-4 cursor-help"
                    inline={true}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-secondary-bg text-primary-text max-w-[250px] border-none shadow-[var(--color-card-shadow)]"
                >
                  Includes total cash value of all items, including duped
                  items&apos; cash value.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-primary-text text-lg font-bold">
              ${formatNetworth(networth)}
            </div>
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-1 flex items-center justify-center gap-1.5 text-sm">
              Inventory Value
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon
                    icon="material-symbols:info-outline"
                    className="text-secondary-text h-4 w-4 cursor-help"
                    inline={true}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-secondary-bg text-primary-text max-w-[250px] border-none shadow-[var(--color-card-shadow)]"
                >
                  Only counts clean items&apos; cash value. Does not include
                  cash value of duped items.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-primary-text text-lg font-bold">
              $
              {inventory_value !== undefined
                ? formatNetworth(inventory_value)
                : "0"}
            </div>
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-1 text-sm">Cash</div>
            <div className="text-primary-text text-lg font-bold">
              ${money !== undefined ? formatNetworth(money) : "0"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-primary-text text-sm font-semibold">
                Collection Progress
              </h4>
            </div>

            {itemsData.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-secondary-text text-sm">
                  Item list unavailable, can&apos;t calculate missing items.
                </p>
              </div>
            ) : overallProgress.total === 0 ? (
              <div className="py-6 text-center">
                <p className="text-secondary-text text-sm">No items found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unverifiableCount > 0 && (
                  <div className="text-secondary-text text-xs">
                    Unverifiable:{" "}
                    <span className="text-primary-text font-mono font-semibold tabular-nums">
                      {formatInventoryCount(unverifiableCount)}
                    </span>{" "}
                    assumed owned. Hidden from missing list.
                    <button
                      type="button"
                      onClick={scrollToUnverifiableSection}
                      className="text-link hover:text-link-hover ml-2 cursor-pointer underline underline-offset-2"
                    >
                      View list
                    </button>
                  </div>
                )}
                <div className="bg-tertiary-bg flex h-8 w-full overflow-hidden rounded-lg">
                  {overallProgress.total > 0 ? (
                    typeProgress
                      .filter((entry) => entry.total > 0)
                      .map((entry) => {
                        const totalCompletion = typeProgress.reduce(
                          (sum, next) =>
                            sum + (next.total > 0 ? next.percentage : 0),
                          0,
                        );
                        const width =
                          totalCompletion > 0
                            ? (entry.percentage / totalCompletion) * 100
                            : 0;
                        return (
                          <Tooltip key={entry.type}>
                            <TooltipTrigger asChild>
                              <div
                                className="group relative"
                                style={{
                                  width: `${width}%`,
                                  backgroundColor: getCategoryColor(entry.type),
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div className="grid min-w-[12rem] gap-1.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-[2px]"
                                    style={{
                                      backgroundColor: getCategoryColor(
                                        entry.type,
                                      ),
                                    }}
                                  />
                                  <span className="font-medium">
                                    {entry.type}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-secondary-text">
                                    Owned
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatInventoryCount(entry.owned)}/
                                    {formatInventoryCount(entry.total)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-secondary-text">
                                    Missing
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatInventoryCount(entry.missingCount)}/
                                    {formatInventoryCount(entry.total)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-secondary-text">
                                    Completion
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatPercentage(entry.percentage)}%
                                  </span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })
                  ) : (
                    <div className="bg-tertiary-bg flex h-full w-full items-center justify-center">
                      <span className="text-secondary-text text-xs">
                        No items
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-xs">
                      Unique Owned
                    </div>
                    <div className="text-primary-text font-mono text-lg font-bold tabular-nums">
                      {formatInventoryCount(overallProgress.owned)}/
                      {formatInventoryCount(overallProgress.total)}
                    </div>
                  </div>
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-xs">
                      Unique Missing
                    </div>
                    <div className="text-primary-text font-mono text-lg font-bold tabular-nums">
                      {formatInventoryCount(overallProgress.missingCount)}/
                      {formatInventoryCount(overallProgress.total)}
                    </div>
                  </div>
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-xs">
                      Completion
                    </div>
                    <div className="text-primary-text font-mono text-lg font-bold tabular-nums">
                      {formatPercentage(overallProgress.percentage)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {typeProgress.map((entry) => {
                    const categoryIcon = getCategoryIcon(entry.type);
                    return (
                      <div
                        key={entry.type}
                        className="border-border-card bg-tertiary-bg flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {categoryIcon ? (
                            <categoryIcon.Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: getCategoryColor(entry.type) }}
                            />
                          ) : (
                            <div
                              className="h-3 w-3 shrink-0 rounded-sm"
                              style={{
                                backgroundColor: getCategoryColor(entry.type),
                              }}
                            />
                          )}
                          <span className="text-primary-text font-medium">
                            {entry.type}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-primary-text text-xs font-semibold">
                            {formatPercentage(entry.percentage)}%
                          </span>
                          <span className="text-primary-text font-mono text-xs font-semibold tabular-nums">
                            {formatInventoryCount(entry.owned)}/
                            {formatInventoryCount(entry.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-border-card bg-tertiary-bg rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-primary-text text-sm font-semibold">
                      Trackable Missing Items (
                      {formatInventoryCount(missingItemsAll.length)})
                    </div>
                  </div>
                  {unverifiableCount > 0 && (
                    <div className="text-secondary-text mb-2 text-xs">
                      {formatInventoryCount(unverifiableCount)} unverifiable
                      items are assumed owned and excluded from this list.
                    </div>
                  )}
                  <div className="mb-2">
                    <div className="flex w-full flex-col gap-4 sm:flex-row">
                      <div className="relative w-full sm:w-2/3">
                        <input
                          type="text"
                          placeholder="Search missing items..."
                          value={missingSearch}
                          onChange={(e) => setMissingSearch(e.target.value)}
                          maxLength={80}
                          className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-3 py-2 pr-9 pl-9 text-sm transition-all duration-300 focus:outline-none"
                        />
                        <Icon
                          icon="heroicons:magnifying-glass"
                          className="text-secondary-text absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                        />
                        {missingSearch && (
                          <button
                            type="button"
                            onClick={() => setMissingSearch("")}
                            className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 cursor-pointer"
                            aria-label="Clear missing item search"
                          >
                            <Icon icon="heroicons:x-mark" />
                          </button>
                        )}
                      </div>
                      <div className="w-full sm:w-1/3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="border-border-card bg-secondary-bg text-primary-text hover:bg-quaternary-bg flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                              aria-label="Filter missing items by type"
                            >
                              <span className="truncate">
                                {missingTypeFilter === "all"
                                  ? "All types"
                                  : missingTypeFilter}
                              </span>
                              <Icon
                                icon="heroicons:chevron-down"
                                className="text-secondary-text h-4 w-4"
                                inline={true}
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[280px] w-[var(--radix-popper-anchor-width)] min-w-[14rem] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                          >
                            <DropdownMenuRadioGroup
                              value={missingTypeFilter}
                              onValueChange={(value) =>
                                setMissingTypeFilter(value)
                              }
                            >
                              <DropdownMenuRadioItem
                                value="all"
                                className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                              >
                                All types
                              </DropdownMenuRadioItem>
                              {missingTypeOptions.map((type) => (
                                <DropdownMenuRadioItem
                                  key={type}
                                  value={type}
                                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                                >
                                  {type}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {(missingSearch.trim() || missingTypeFilter !== "all") && (
                      <div className="text-secondary-text mt-1 text-xs">
                        Showing{" "}
                        {formatInventoryCount(filteredMissingItems.length)} of{" "}
                        {formatInventoryCount(missingItemsAll.length)}
                      </div>
                    )}
                  </div>
                  {missingItemsAll.length === 0 ? (
                    <p className="text-secondary-text text-sm">
                      You have every item in this filter.
                    </p>
                  ) : filteredMissingItems.length === 0 ? (
                    <p className="text-secondary-text text-sm">
                      No missing items match your search.
                    </p>
                  ) : (
                    <div className="scrollbar-thin max-h-[260px] overflow-auto pr-1 text-sm">
                      <ol className="divide-border-card/60 space-y-0 divide-y">
                        {filteredMissingItems.map((item, idx) => (
                          <li
                            key={item.id}
                            className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:gap-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="text-secondary-text w-10 shrink-0 text-right font-mono text-xs font-medium tabular-nums">
                                {idx + 1}.
                              </span>
                              <Link
                                href={`/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`}
                                prefetch={false}
                                className="text-primary-text hover:text-link min-w-0 flex-1 truncate text-sm font-semibold transition-colors"
                              >
                                {item.name}
                              </Link>
                            </div>
                            <div className="flex justify-end sm:ml-auto">
                              <span
                                className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                                style={{
                                  borderColor: getCategoryColor(item.type),
                                }}
                              >
                                {(() => {
                                  const categoryIcon = getCategoryIcon(
                                    item.type,
                                  );
                                  return categoryIcon ? (
                                    <categoryIcon.Icon
                                      className="h-3 w-3"
                                      style={{
                                        color: getCategoryColor(item.type),
                                      }}
                                    />
                                  ) : null;
                                })()}
                                {item.type}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {unverifiableItemsAll.length > 0 && (
                  <div
                    ref={unverifiableSectionRef}
                    id="unverifiable-items"
                    className="border-border-card bg-tertiary-bg rounded-lg border p-3"
                  >
                    <div className="text-primary-text mb-2 text-sm font-semibold">
                      Unverifiable Items (
                      {formatInventoryCount(unverifiableItemsAll.length)})
                    </div>
                    <div className="text-secondary-text mb-2 text-xs">
                      Not returned by scans; assumed owned for completion and
                      hidden from the missing list.
                    </div>
                    <div className="mb-2">
                      <div className="flex w-full flex-col gap-4 sm:flex-row">
                        <div className="relative w-full sm:w-2/3">
                          <input
                            type="text"
                            placeholder="Search unverifiable items..."
                            value={unverifiableSearch}
                            onChange={(e) =>
                              setUnverifiableSearch(e.target.value)
                            }
                            maxLength={80}
                            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-3 py-2 pr-9 pl-9 text-sm transition-all duration-300 focus:outline-none"
                          />
                          <Icon
                            icon="heroicons:magnifying-glass"
                            className="text-secondary-text absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                          />
                          {unverifiableSearch && (
                            <button
                              type="button"
                              onClick={() => setUnverifiableSearch("")}
                              className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 h-6 w-6 -translate-y-1/2 cursor-pointer"
                              aria-label="Clear unverifiable item search"
                            >
                              <Icon icon="heroicons:x-mark" />
                            </button>
                          )}
                        </div>
                        <div className="w-full sm:w-1/3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="border-border-card bg-secondary-bg text-primary-text hover:bg-quaternary-bg flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                                aria-label="Filter unverifiable items by type"
                              >
                                <span className="truncate">
                                  {unverifiableTypeFilter === "all"
                                    ? "All types"
                                    : unverifiableTypeFilter}
                                </span>
                                <Icon
                                  icon="heroicons:chevron-down"
                                  className="text-secondary-text h-4 w-4"
                                  inline={true}
                                />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[280px] w-[var(--radix-popper-anchor-width)] min-w-[14rem] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
                            >
                              <DropdownMenuRadioGroup
                                value={unverifiableTypeFilter}
                                onValueChange={(value) =>
                                  setUnverifiableTypeFilter(value)
                                }
                              >
                                <DropdownMenuRadioItem
                                  value="all"
                                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                                >
                                  All types
                                </DropdownMenuRadioItem>
                                {unverifiableTypeOptions.map((type) => (
                                  <DropdownMenuRadioItem
                                    key={type}
                                    value={type}
                                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                                  >
                                    {type}
                                  </DropdownMenuRadioItem>
                                ))}
                              </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {(unverifiableSearch.trim() ||
                        unverifiableTypeFilter !== "all") && (
                        <div className="text-secondary-text mt-1 text-xs">
                          Showing{" "}
                          {formatInventoryCount(
                            filteredUnverifiableItems.length,
                          )}{" "}
                          of {formatInventoryCount(unverifiableItemsAll.length)}
                        </div>
                      )}
                    </div>
                    {filteredUnverifiableItems.length === 0 ? (
                      <p className="text-secondary-text text-sm">
                        No unverifiable items match your search.
                      </p>
                    ) : (
                      <div className="scrollbar-thin max-h-[220px] overflow-auto pr-1 text-sm">
                        <ol className="divide-border-card/60 space-y-0 divide-y">
                          {filteredUnverifiableItems.map((item, idx) => (
                            <li
                              key={item.id}
                              className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:gap-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="text-secondary-text w-10 shrink-0 text-right font-mono text-xs font-medium tabular-nums">
                                  {idx + 1}.
                                </span>
                                <Link
                                  href={`/item/${encodeURIComponent(item.type.toLowerCase())}/${encodeURIComponent(item.name)}`}
                                  prefetch={false}
                                  className="text-primary-text hover:text-link min-w-0 flex-1 truncate text-sm font-semibold transition-colors"
                                >
                                  {item.name}
                                </Link>
                              </div>
                              <div className="flex justify-end sm:ml-auto">
                                <span
                                  className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                                  style={{
                                    borderColor: getCategoryColor(item.type),
                                  }}
                                >
                                  {(() => {
                                    const categoryIcon = getCategoryIcon(
                                      item.type,
                                    );
                                    return categoryIcon ? (
                                      <categoryIcon.Icon
                                        className="h-3 w-3"
                                        style={{
                                          color: getCategoryColor(item.type),
                                        }}
                                      />
                                    ) : null;
                                  })()}
                                  {item.type}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4">
          <div
            className="inventory-breakdown-sticky-card border-border-card bg-secondary-bg rounded-lg border p-4"
            style={{ top: "calc(var(--header-height, 0px) + 16px)" }}
          >
            <div className="mb-2 text-center">
              <div className="text-primary-text text-sm font-semibold">
                Collection Progress Pie Chart
              </div>
            </div>

            {overallProgress.missingCount === 0 ? (
              <div className="py-10 text-center">
                <p className="text-secondary-text text-sm">No missing items.</p>
              </div>
            ) : (
              <>
                <ChartContainer
                  config={collectionChartConfig}
                  className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[360px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel={true}
                          formatter={(value, name, item) => {
                            const payloadData = item?.payload as
                              | {
                                  fill?: string;
                                  owned?: number;
                                  total?: number;
                                  missingCount?: number;
                                  percentage?: number;
                                }
                              | undefined;
                            const swatchColor =
                              item?.color ||
                              payloadData?.fill ||
                              "var(--color-primary-text)";

                            return (
                              <div className="flex min-w-[12rem] flex-col gap-1.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-[2px]"
                                    style={{ backgroundColor: swatchColor }}
                                  />
                                  <span className="text-primary-text font-medium">
                                    {name}
                                  </span>
                                </div>
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-secondary-text">
                                    Missing
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatInventoryCount(
                                      payloadData?.missingCount || 0,
                                    )}
                                    /
                                    {formatInventoryCount(
                                      payloadData?.total || 0,
                                    )}
                                  </span>
                                </div>
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-secondary-text">
                                    Owned
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatInventoryCount(
                                      payloadData?.owned || 0,
                                    )}
                                    /
                                    {formatInventoryCount(
                                      payloadData?.total || 0,
                                    )}
                                  </span>
                                </div>
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-secondary-text">
                                    Completion
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatPercentage(
                                      payloadData?.percentage || 0,
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Pie
                      data={collectionChartData}
                      dataKey="value"
                      nameKey="category"
                      innerRadius="58%"
                      outerRadius="88%"
                      strokeWidth={2}
                    >
                      {collectionChartData.map((entry) => (
                        <Cell key={entry.category} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {collectionChartData.map((entry) => (
                    <div
                      key={entry.category}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                        aria-hidden="true"
                      />
                      <span className="text-primary-text">
                        {entry.category}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <h4 className="text-primary-text mb-3 text-sm font-semibold">
              Inventory Breakdown
            </h4>
            {Object.keys(percentages).length > 0 ? (
              <>
                <div className="bg-tertiary-bg mb-4 flex h-8 w-full overflow-hidden rounded-lg">
                  {sortedCategoryEntries.map(([category, percentage]) => (
                    <Tooltip key={category}>
                      <TooltipTrigger asChild>
                        <div
                          className="group relative"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category),
                          }}
                        ></div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="grid min-w-[10rem] gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{
                                backgroundColor: getCategoryColor(category),
                              }}
                            />
                            <span className="font-medium">{category}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-secondary-text">
                              Percentage
                            </span>
                            <span className="text-primary-text font-mono font-medium tabular-nums">
                              {formatPercentage(percentage)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-secondary-text">Value</span>
                            <span className="text-primary-text font-mono font-medium tabular-nums">
                              ${formatNetworth(categoryValues[category] || 0)}
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {sortedCategoryEntries.map(([category, percentage]) => {
                    const categoryIcon = getCategoryIcon(category);
                    return (
                      <div
                        key={category}
                        className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {categoryIcon ? (
                            <categoryIcon.Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: getCategoryColor(category) }}
                            />
                          ) : (
                            <div
                              className="h-3 w-3 shrink-0 rounded-sm"
                              style={{
                                backgroundColor: getCategoryColor(category),
                              }}
                            />
                          )}
                          <span className="text-primary-text font-medium">
                            {category}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-primary-text text-xs font-semibold">
                            {formatPercentage(percentage)}%
                          </span>
                          <span className="text-primary-text text-sm font-semibold">
                            ${formatNetworth(categoryValues[category] || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-secondary-text">
                  No breakdown available for this inventory
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4">
          <div
            className="inventory-breakdown-sticky-card border-border-card bg-secondary-bg rounded-lg border p-4"
            style={{ top: "calc(var(--header-height, 0px) + 16px)" }}
          >
            <div className="mb-2 text-center">
              <div className="text-primary-text text-sm font-semibold">
                Inventory Breakdown Pie Chart
              </div>
            </div>
            <ChartContainer
              config={categoryChartConfig}
              className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[360px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel={true}
                      formatter={(value, name, item) => {
                        const payloadData = item?.payload as
                          | { fill?: string; amount?: number }
                          | undefined;
                        const swatchColor =
                          item?.color ||
                          payloadData?.fill ||
                          "var(--color-primary-text)";

                        return (
                          <div className="flex min-w-[10rem] flex-col gap-1.5 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-[2px]"
                                style={{ backgroundColor: swatchColor }}
                              />
                              <span className="text-primary-text font-medium">
                                {name}
                              </span>
                            </div>
                            <div className="flex w-full items-center justify-between">
                              <span className="text-secondary-text">
                                Percentage
                              </span>
                              <span className="text-primary-text font-mono font-medium tabular-nums">
                                {formatPercentage(Number(value))}%
                              </span>
                            </div>
                            <div className="flex w-full items-center justify-between">
                              <span className="text-secondary-text">Value</span>
                              <span className="text-primary-text font-mono font-medium tabular-nums">
                                ${formatNetworth(payloadData?.amount || 0)}
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  nameKey="category"
                  innerRadius="58%"
                  outerRadius="88%"
                  strokeWidth={2}
                >
                  {categoryChartData.map((entry) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {categoryChartData.map((entry) => (
                <div
                  key={entry.category}
                  className="flex items-center gap-2 text-sm"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                    aria-hidden="true"
                  />
                  <span className="text-primary-text">{entry.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Duplicates Breakdown - Only show if duplicates data is available */}
      {duplicatesCount !== undefined &&
        duplicatesValue !== undefined &&
        duplicatesValue !== null &&
        duplicatesPercentages &&
        Object.keys(duplicatesPercentages).length > 0 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="border-border-card bg-secondary-bg space-y-4 rounded-lg border p-4">
                <h4 className="text-primary-text text-sm font-semibold">
                  Duplicate Inventory Breakdown
                </h4>
                <div className="bg-tertiary-bg flex h-8 w-full overflow-hidden rounded-lg">
                  {sortedDuplicateEntries.map(([category, percentage]) => (
                    <Tooltip key={category}>
                      <TooltipTrigger asChild>
                        <div
                          className="group relative"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category),
                          }}
                        ></div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="grid min-w-[10rem] gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{
                                backgroundColor: getCategoryColor(category),
                              }}
                            />
                            <span className="font-medium">{category}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-secondary-text">
                              Percentage
                            </span>
                            <span className="text-primary-text font-mono font-medium tabular-nums">
                              {formatPercentage(percentage)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-secondary-text">Value</span>
                            <span className="text-primary-text font-mono font-medium tabular-nums">
                              $
                              {formatNetworth(
                                duplicateCategoryValues[category] || 0,
                              )}
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {sortedDuplicateEntries.map(([category, percentage]) => {
                    const categoryIcon = getCategoryIcon(category);
                    return (
                      <div
                        key={category}
                        className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {categoryIcon ? (
                            <categoryIcon.Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: getCategoryColor(category) }}
                            />
                          ) : (
                            <div
                              className="h-3 w-3 shrink-0 rounded-sm"
                              style={{
                                backgroundColor: getCategoryColor(category),
                              }}
                            />
                          )}
                          <span className="text-primary-text font-medium">
                            {category}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-primary-text text-xs font-semibold">
                            {formatPercentage(percentage)}%
                          </span>
                          <span className="text-primary-text text-sm font-semibold">
                            $
                            {formatNetworth(
                              duplicateCategoryValues[category] || 0,
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div
                className="inventory-breakdown-sticky-card border-border-card bg-secondary-bg rounded-lg border p-4"
                style={{ top: "calc(var(--header-height, 0px) + 16px)" }}
              >
                <div className="mb-2 text-center">
                  <div className="text-primary-text text-sm font-semibold">
                    Duplicate Inventory Breakdown Pie Chart
                  </div>
                </div>
                <ChartContainer
                  config={categoryChartConfig}
                  className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[360px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel={true}
                          formatter={(value, name, item) => {
                            const payloadData = item?.payload as
                              | { fill?: string; amount?: number }
                              | undefined;
                            const swatchColor =
                              item?.color ||
                              payloadData?.fill ||
                              "var(--color-primary-text)";

                            return (
                              <div className="flex min-w-[10rem] flex-col gap-1.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-[2px]"
                                    style={{ backgroundColor: swatchColor }}
                                  />
                                  <span className="text-primary-text font-medium">
                                    {name}
                                  </span>
                                </div>
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-secondary-text">
                                    Percentage
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatPercentage(Number(value))}%
                                  </span>
                                </div>
                                <div className="flex w-full items-center justify-between">
                                  <span className="text-secondary-text">
                                    Value
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    ${formatNetworth(payloadData?.amount || 0)}
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Pie
                      data={duplicatesChartData}
                      dataKey="value"
                      nameKey="category"
                      innerRadius="58%"
                      outerRadius="88%"
                      strokeWidth={2}
                    >
                      {duplicatesChartData.map((entry) => (
                        <Cell key={entry.category} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {duplicatesChartData.map((entry) => (
                    <div
                      key={entry.category}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                        aria-hidden="true"
                      />
                      <span className="text-primary-text">
                        {entry.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
