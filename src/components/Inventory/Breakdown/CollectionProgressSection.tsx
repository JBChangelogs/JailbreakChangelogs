import type { RefObject } from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatInventoryCount,
  formatPercentage,
} from "@/components/Inventory/Breakdown/constants";
import CategoryPieCard from "@/components/Inventory/Breakdown/CategoryPieCard";
import CategoryProgressBar from "@/components/Inventory/Breakdown/CategoryProgressBar";
import SearchableInventoryListSection from "@/components/Inventory/Breakdown/SearchableInventoryListSection";
import type { useInventoryBreakdownStats } from "@/hooks/useInventoryBreakdownStats";

type InventoryBreakdownStats = ReturnType<typeof useInventoryBreakdownStats>;

interface CollectionProgressSectionProps {
  itemsAvailable: boolean;
  overallProgress: InventoryBreakdownStats["overallProgress"];
  typeProgress: InventoryBreakdownStats["typeProgress"];
  unverifiableCount: number;
  missingItemsAll: InventoryBreakdownStats["missingItemsAll"];
  unverifiableItemsAll: InventoryBreakdownStats["unverifiableItemsAll"];
  collectionChartConfig: InventoryBreakdownStats["collectionChartConfig"];
  collectionChartData: InventoryBreakdownStats["collectionChartData"];
  renderCharts: boolean;
  unverifiableSectionRef: RefObject<HTMLDivElement | null>;
  onViewUnverifiable: () => void;
}

export default function CollectionProgressSection({
  itemsAvailable,
  overallProgress,
  typeProgress,
  unverifiableCount,
  missingItemsAll,
  unverifiableItemsAll,
  collectionChartConfig,
  collectionChartData,
  renderCharts,
  unverifiableSectionRef,
  onViewUnverifiable,
}: CollectionProgressSectionProps) {
  return (
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
                  How many of the {overallProgress.total} items in Jailbreak you
                  own. Unverifiable items are assumed owned.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {!itemsAvailable ? (
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
                    onClick={onViewUnverifiable}
                    className="text-link hover:text-link-hover ml-2 cursor-pointer underline underline-offset-2"
                  >
                    View list
                  </button>
                </div>
              )}
              <CategoryProgressBar
                entries={
                  overallProgress.total > 0
                    ? typeProgress
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

                          return {
                            key: entry.type,
                            label: entry.type,
                            widthPercent: width,
                            color: getCategoryColor(entry.type),
                            tooltip: (
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
                            ),
                          };
                        })
                    : []
                }
                emptyMessage="No items"
              />

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
  );
}
