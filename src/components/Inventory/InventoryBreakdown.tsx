"use client";

import { useRef } from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { UserNetworthData } from "@/utils/api/api";
import { Icon } from "@/components/ui/IconWrapper";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Cell, Pie, PieChart } from "recharts";
import type { Item } from "@/types";
import type { InventoryData } from "@/app/inventories/types";
import {
  formatInventoryCount,
  formatNetworth,
  formatPercentage,
} from "@/components/Inventory/Breakdown/constants";
import CategoryPieCard from "@/components/Inventory/Breakdown/CategoryPieCard";
import SearchableInventoryListSection from "@/components/Inventory/Breakdown/SearchableInventoryListSection";
import { useInventoryBreakdownStats } from "@/hooks/useInventoryBreakdownStats";

interface InventoryBreakdownProps {
  networthData: UserNetworthData[];
  username: string;
  itemsData: Item[];
  inventoryData: InventoryData;
  isActive?: boolean;
}

export default function InventoryBreakdown({
  networthData,
  itemsData,
  inventoryData,
  isActive = true,
}: InventoryBreakdownProps) {
  // Once the tab becomes active, keep charts rendered permanently to avoid
  // re-mounting them on every tab switch (isActive changes are ignored by memo).
  const hasBeenActiveRef = useRef(isActive);
  if (isActive) hasBeenActiveRef.current = true;
  const renderCharts = hasBeenActiveRef.current;

  const {
    latestData,
    categoryValues,
    sortedCategoryEntries,
    categoryChartData,
    categoryChartConfig,
    duplicateCategoryValues,
    unverifiableItemsAll,
    unverifiableCount,
    typeProgress,
    overallProgress,
    ogOwnedProgress,
    missingItemsAll,
    ogMissingItemsAll,
    networth,
    money,
    inventoryValue,
    percentages,
    duplicatesCount,
    duplicatesValue,
    sortedDuplicateEntries,
    duplicatesChartData,
    totalItems,
    collectionChartConfig,
    collectionChartData,
    ogChartConfig,
    ogChartData,
  } = useInventoryBreakdownStats(networthData, itemsData, inventoryData);

  const unverifiableSectionRef = useRef<HTMLDivElement>(null);

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

  const safePercentages = percentages ?? {};

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
                  className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
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
                  className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
                >
                  Only counts clean items&apos; cash value. Does not include
                  cash value of duped items.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-primary-text text-lg font-bold">
              $
              {inventoryValue !== undefined
                ? formatNetworth(inventoryValue)
                : "0"}
            </div>
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-1 text-sm">Cash</div>
            <div className="text-primary-text text-lg font-bold">
              ${formatNetworth(money)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className="text-primary-text text-sm font-semibold">
                  Collection Progress
                </h4>
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
                    className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
                  >
                    How many of the {overallProgress.total} items in Jailbreak
                    you own. Unverifiable items are assumed owned.
                  </TooltipContent>
                </Tooltip>
              </div>
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
                              <div className="grid min-w-48 gap-1.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-xs"
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

                <SearchableInventoryListSection
                  title="Trackable Missing Items"
                  tooltipContent={
                    <>
                      Items not in your inventory that can be confirmed missing.
                      Excludes unverifiable items.
                    </>
                  }
                  items={missingItemsAll}
                  searchPlaceholder="Search missing items..."
                  filterAriaLabel="Filter missing items by type"
                  clearAriaLabel="Clear missing item search"
                  emptyMessage="You have every item in this filter."
                  noResultsMessage="No missing items match your search."
                  helperContent={
                    unverifiableCount > 0 ? (
                      <>
                        {formatInventoryCount(unverifiableCount)} unverifiable
                        items are assumed owned and excluded from this list.
                      </>
                    ) : undefined
                  }
                />

                {unverifiableItemsAll.length > 0 && (
                  <SearchableInventoryListSection
                    title="Unverifiable Items"
                    tooltipContent={
                      <>
                        Items that inventory scans can&apos;t detect. They are
                        assumed owned and excluded from the missing list.
                      </>
                    }
                    items={unverifiableItemsAll}
                    searchPlaceholder="Search unverifiable items..."
                    filterAriaLabel="Filter unverifiable items by type"
                    clearAriaLabel="Clear unverifiable item search"
                    emptyMessage="No unverifiable items found."
                    noResultsMessage="No unverifiable items match your search."
                    sectionRef={unverifiableSectionRef}
                    sectionId="unverifiable-items"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4">
          <CategoryPieCard
            title="Collection Progress Pie Chart"
            chartConfig={collectionChartConfig}
            data={collectionChartData}
            renderCharts={renderCharts}
            isEmpty={overallProgress.missingCount === 0}
            emptyMessage="No missing items."
            tooltipWidth="wide"
            renderTooltipRows={(payload) => {
              const payloadData = payload as
                | {
                    owned?: number;
                    total?: number;
                    missingCount?: number;
                    percentage?: number;
                  }
                | undefined;

              return (
                <>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-secondary-text">Missing</span>
                    <span className="text-primary-text font-mono font-medium tabular-nums">
                      {formatInventoryCount(payloadData?.missingCount || 0)}/
                      {formatInventoryCount(payloadData?.total || 0)}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-secondary-text">Owned</span>
                    <span className="text-primary-text font-mono font-medium tabular-nums">
                      {formatInventoryCount(payloadData?.owned || 0)}/
                      {formatInventoryCount(payloadData?.total || 0)}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-secondary-text">Completion</span>
                    <span className="text-primary-text font-mono font-medium tabular-nums">
                      {formatPercentage(payloadData?.percentage || 0)}%
                    </span>
                  </div>
                </>
              );
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <h4 className="text-primary-text text-sm font-semibold">
                OG Owned
              </h4>
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
                  className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
                >
                  Items where this player is the original owner in
                  Jailbreak&apos;s records, regardless of trading history.
                </TooltipContent>
              </Tooltip>
            </div>

            {itemsData.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-secondary-text text-sm">
                  Item list unavailable, can&apos;t calculate OG owned.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-tertiary-bg flex h-8 w-full overflow-hidden rounded-lg">
                  {ogOwnedProgress.ogOwned > 0 ? (
                    typeProgress
                      .filter((entry) => entry.ogOwned > 0)
                      .map((entry) => {
                        const width =
                          (entry.ogOwned / ogOwnedProgress.ogOwned) * 100;
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
                              <div className="grid min-w-48 gap-1.5 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 rounded-xs"
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
                                    OG Owned
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatInventoryCount(entry.ogOwned)}/
                                    {formatInventoryCount(entry.total)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-secondary-text">
                                    Completion
                                  </span>
                                  <span className="text-primary-text font-mono font-medium tabular-nums">
                                    {formatPercentage(
                                      entry.total > 0
                                        ? (entry.ogOwned / entry.total) * 100
                                        : 0,
                                    )}
                                    %
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
                        No items owned
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-xs">
                      OG Owned
                    </div>
                    <div className="text-primary-text font-mono text-lg font-bold tabular-nums">
                      {formatInventoryCount(ogOwnedProgress.ogOwned)}/
                      {formatInventoryCount(ogOwnedProgress.total)}
                    </div>
                  </div>
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-xs">
                      OG Missing
                    </div>
                    <div className="text-primary-text font-mono text-lg font-bold tabular-nums">
                      {formatInventoryCount(ogOwnedProgress.ogMissing)}/
                      {formatInventoryCount(ogOwnedProgress.total)}
                    </div>
                  </div>
                  <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                    <div className="text-secondary-text mb-1 text-xs">
                      Completion
                    </div>
                    <div className="text-primary-text font-mono text-lg font-bold tabular-nums">
                      {formatPercentage(ogOwnedProgress.percentage)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {typeProgress.map((entry) => {
                    const categoryIcon = getCategoryIcon(entry.type);
                    const ogPct =
                      entry.total > 0 ? (entry.ogOwned / entry.total) * 100 : 0;
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
                            {formatPercentage(ogPct)}%
                          </span>
                          <span className="text-primary-text font-mono text-xs font-semibold tabular-nums">
                            {formatInventoryCount(entry.ogOwned)}/
                            {formatInventoryCount(entry.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <SearchableInventoryListSection
                  title="Trackable Missing OG Items"
                  tooltipContent={
                    <>
                      Items in Jailbreak where this player is not the original
                      owner, including items not in their inventory. Excludes
                      unverifiable items.
                    </>
                  }
                  items={ogMissingItemsAll}
                  searchPlaceholder="Search missing OG items..."
                  filterAriaLabel="Filter non-OG items by type"
                  clearAriaLabel="Clear non-OG item search"
                  emptyMessage="This player is the original owner of every item in Jailbreak."
                  noResultsMessage="No items match your search."
                  helperContent={
                    unverifiableCount > 0 ? (
                      <>
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
                      </>
                    ) : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-4">
          <CategoryPieCard
            title="OG Owned Pie Chart"
            chartConfig={ogChartConfig}
            data={ogChartData}
            renderCharts={renderCharts}
            isEmpty={ogOwnedProgress.ogOwned === 0}
            emptyMessage="No OG owned items."
            tooltipWidth="wide"
            renderTooltipRows={(payload, value) => {
              const payloadData = payload as
                | {
                    total?: number;
                    percentage?: number;
                  }
                | undefined;

              return (
                <>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-secondary-text">OG Owned</span>
                    <span className="text-primary-text font-mono font-medium tabular-nums">
                      {formatInventoryCount(Number(value))}/
                      {formatInventoryCount(payloadData?.total || 0)}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-secondary-text">Completion</span>
                    <span className="text-primary-text font-mono font-medium tabular-nums">
                      {formatPercentage(payloadData?.percentage || 0)}%
                    </span>
                  </div>
                </>
              );
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-1.5">
              <h4 className="text-primary-text text-sm font-semibold">
                Inventory Breakdown
              </h4>
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
                  className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
                >
                  How your clean inventory&apos;s total value is distributed
                  across item categories.
                </TooltipContent>
              </Tooltip>
            </div>
            {Object.keys(safePercentages).length > 0 ? (
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
                        <div className="grid min-w-40 gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-xs"
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
          <CategoryPieCard
            title="Inventory Breakdown Pie Chart"
            chartConfig={categoryChartConfig}
            data={categoryChartData}
            renderCharts={renderCharts}
            renderTooltipRows={(payload, value) => {
              const payloadData = payload as { amount?: number } | undefined;

              return (
                <>
                  <div className="flex w-full items-center justify-between">
                    <span className="text-secondary-text">Percentage</span>
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
                </>
              );
            }}
          />
        </div>
      </div>

      {/* Duplicates Breakdown - Only show if duplicates data is available */}
      {duplicatesCount !== undefined &&
        duplicatesValue !== undefined &&
        duplicatesValue !== null &&
        sortedDuplicateEntries.length > 0 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <div className="border-border-card bg-secondary-bg space-y-4 rounded-lg border p-4">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-primary-text text-sm font-semibold">
                    Duplicate Inventory Breakdown
                  </h4>
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
                      className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
                    >
                      How your duplicated items&apos; total value is distributed
                      across item categories.
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                        <div className="grid min-w-40 gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2.5 w-2.5 rounded-xs"
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
                {renderCharts && (
                  <>
                    <ChartContainer
                      config={categoryChartConfig}
                      className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square h-[min(360px,calc(100vw-3rem))] max-h-90 w-full max-w-90"
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
                                  <div className="flex min-w-40 flex-col gap-1.5 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="h-2.5 w-2.5 rounded-xs"
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
                                        $
                                        {formatNetworth(
                                          payloadData?.amount || 0,
                                        )}
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
                          isAnimationActive={false}
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
