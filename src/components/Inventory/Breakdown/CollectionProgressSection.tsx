import { useId, type RefObject } from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import {
  formatInventoryCount,
  formatPercentage,
} from "@/components/Inventory/Breakdown/constants";
import { CategoryPieCard } from "@/components/Inventory/LazyCharts";
import CategoryProgressBar from "@/components/Inventory/Breakdown/CategoryProgressBar";
import SearchableInventoryListSection from "@/components/Inventory/Breakdown/SearchableInventoryListSection";
import type { useInventoryBreakdownStats } from "@/hooks/useInventoryBreakdownStats";

type InventoryBreakdownStats = ReturnType<typeof useInventoryBreakdownStats>;

interface CollectionProgressSectionProps {
  countLowerLevels: boolean;
  creditedHyperchromeLevels: number;
  onCountLowerLevelsChange: (value: boolean) => void;
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
  countLowerLevels,
  creditedHyperchromeLevels,
  onCountLowerLevelsChange,
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
  const modeId = useId();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <div>
          <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5">
              <h4 className="text-primary-text text-lg font-semibold">
                Collection Progress
              </h4>
            </div>
            <span className="text-secondary-text text-base leading-relaxed">
              Hyperchromes:{" "}
              {countLowerLevels
                ? "lower levels count"
                : "count owned levels only"}
            </span>
          </div>
          <p className="text-secondary-text mb-1 text-base leading-relaxed">
            Completion counts unique items using the Hyperchrome mode selected
            below.
          </p>

          {overallProgress.total === 0 ? (
            <div className="py-6 text-center">
              <p className="text-secondary-text text-base">No items found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unverifiableCount > 0 && (
                <div className="text-secondary-text text-base leading-relaxed">
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
                              <div className="grid min-w-48 gap-1.5 text-sm">
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
                                    Collected
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
                  <div className="text-secondary-text mb-1 text-sm">
                    Unique Collected
                  </div>
                  <div className="text-primary-text font-mono text-xl font-bold tabular-nums">
                    {formatInventoryCount(overallProgress.owned)}/
                    {formatInventoryCount(overallProgress.total)}
                  </div>
                </div>
                <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                  <div className="text-secondary-text mb-1 text-sm">
                    Unique Missing
                  </div>
                  <div className="text-primary-text font-mono text-xl font-bold tabular-nums">
                    {formatInventoryCount(overallProgress.missingCount)}/
                    {formatInventoryCount(overallProgress.total)}
                  </div>
                </div>
                <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                  <div className="text-secondary-text mb-1 text-sm">
                    Completion
                  </div>
                  <div className="text-primary-text font-mono text-xl font-bold tabular-nums">
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
                      className="border-border-card/60 flex items-center justify-between gap-3 border-b py-3 text-base"
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
                        <span className="text-primary-text text-sm font-semibold">
                          {formatPercentage(entry.percentage)}%
                        </span>
                        <span className="text-primary-text font-mono text-sm font-semibold tabular-nums">
                          {formatInventoryCount(entry.owned)}/
                          {formatInventoryCount(entry.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <fieldset aria-describedby={`${modeId}-help`}>
                <legend className="text-primary-text mb-2 text-lg font-semibold">
                  Hyperchrome collection mode
                </legend>
                <p
                  id={`${modeId}-help`}
                  className="text-secondary-text mb-3 text-base leading-relaxed"
                >
                  This updates the missing-items list and your collection
                  completion percentage. OG ownership is unchanged.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name={modeId}
                      value="lower-levels"
                      checked={countLowerLevels}
                      onChange={() => onCountLowerLevelsChange(true)}
                      className="accent-button-info mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>
                      <span className="text-primary-text block text-base font-medium">
                        Count lower levels
                      </span>
                      <span className="text-secondary-text block text-base leading-relaxed">
                        For each color, your highest level counts its lower
                        levels too. Higher levels remain missing.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name={modeId}
                      value="every-level"
                      checked={!countLowerLevels}
                      onChange={() => onCountLowerLevelsChange(false)}
                      className="accent-button-info mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>
                      <span className="text-primary-text block text-base font-medium">
                        Count owned levels only
                      </span>
                      <span className="text-secondary-text block text-base leading-relaxed">
                        Each Hyperchrome level counts separately. Owning a
                        higher level doesn&apos;t count its lower levels.
                      </span>
                    </span>
                  </label>
                </div>
                <div
                  role="status"
                  aria-atomic="true"
                  className="mt-4 space-y-1"
                >
                  <p className="text-primary-text text-base font-semibold">
                    {formatInventoryCount(overallProgress.owned)}/
                    {formatInventoryCount(overallProgress.total)} collected
                    {" · "}
                    {formatInventoryCount(overallProgress.missingCount)} missing
                    {" · "}
                    {formatPercentage(overallProgress.percentage)}% complete
                  </p>
                  <p className="text-secondary-text text-base leading-relaxed">
                    {countLowerLevels
                      ? creditedHyperchromeLevels > 0
                        ? `${formatInventoryCount(creditedHyperchromeLevels)} lower Hyperchrome ${creditedHyperchromeLevels === 1 ? "level" : "levels"} counted toward completion.`
                        : "No additional lower Hyperchrome levels to count for this inventory."
                      : "Only Hyperchrome levels currently in your inventory count toward completion."}
                  </p>
                </div>
              </fieldset>

              <SearchableInventoryListSection
                title="Trackable Missing Items"
                items={missingItemsAll}
                searchPlaceholder="Search missing items..."
                filterAriaLabel="Filter missing items by type"
                clearAriaLabel="Clear missing item search"
                emptyMessage="You have every item in this filter."
                noResultsMessage="No missing items match your search."
              />

              {unverifiableItemsAll.length > 0 && (
                <SearchableInventoryListSection
                  title="Unverifiable Items"
                  description="Inventory scans can’t confirm these items."
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
                  <span className="text-secondary-text">Collected</span>
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
