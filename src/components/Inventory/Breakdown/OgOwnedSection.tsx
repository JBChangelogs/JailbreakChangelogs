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

interface OgOwnedSectionProps {
  ogOwnedProgress: InventoryBreakdownStats["ogOwnedProgress"];
  typeProgress: InventoryBreakdownStats["typeProgress"];
  ogMissingItemsAll: InventoryBreakdownStats["ogMissingItemsAll"];
  unverifiableCount: number;
  ogChartConfig: InventoryBreakdownStats["ogChartConfig"];
  ogChartData: InventoryBreakdownStats["ogChartData"];
  renderCharts: boolean;
  onViewUnverifiable: () => void;
}

export default function OgOwnedSection({
  ogOwnedProgress,
  typeProgress,
  ogMissingItemsAll,
  unverifiableCount,
  ogChartConfig,
  ogChartData,
  renderCharts,
  onViewUnverifiable,
}: OgOwnedSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <div>
          <div className="mb-3">
            <h4 className="text-primary-text text-lg font-semibold">
              OG Owned
            </h4>
            <p className="text-secondary-text mt-1 text-base leading-relaxed">
              Items currently in this inventory where this player is recorded as
              the original owner.
            </p>
          </div>

          <div className="space-y-4">
            <CategoryProgressBar
              entries={
                ogOwnedProgress.ogOwned > 0
                  ? typeProgress
                      .filter((entry) => entry.ogOwned > 0)
                      .map((entry) => ({
                        key: entry.type,
                        label: entry.type,
                        widthPercent:
                          (entry.ogOwned / ogOwnedProgress.ogOwned) * 100,
                        color: getCategoryColor(entry.type),
                        tooltip: (
                          <div className="grid min-w-48 gap-1.5 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-xs"
                                style={{
                                  backgroundColor: getCategoryColor(entry.type),
                                }}
                              />
                              <span className="font-medium">{entry.type}</span>
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
                        ),
                      }))
                  : []
              }
              emptyMessage="No items owned"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                <div className="text-secondary-text mb-1 text-sm">OG Owned</div>
                <div className="text-primary-text font-mono text-xl font-bold tabular-nums">
                  {formatInventoryCount(ogOwnedProgress.ogOwned)}/
                  {formatInventoryCount(ogOwnedProgress.total)}
                </div>
              </div>
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  OG Missing
                </div>
                <div className="text-primary-text font-mono text-xl font-bold tabular-nums">
                  {formatInventoryCount(ogOwnedProgress.ogMissing)}/
                  {formatInventoryCount(ogOwnedProgress.total)}
                </div>
              </div>
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-3 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  Completion
                </div>
                <div className="text-primary-text font-mono text-xl font-bold tabular-nums">
                  {formatPercentage(ogOwnedProgress.percentage)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
              {typeProgress.map((entry) => {
                const categoryIcon = getCategoryIcon(entry.type);
                const ogPct =
                  entry.total > 0 ? (entry.ogOwned / entry.total) * 100 : 0;
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
                        {formatPercentage(ogPct)}%
                      </span>
                      <span className="text-primary-text font-mono text-sm font-semibold tabular-nums">
                        {formatInventoryCount(entry.ogOwned)}/
                        {formatInventoryCount(entry.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-4">
        <CategoryPieCard
          title="OG Items by Category"
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
      <div className="xl:col-span-12">
        <SearchableInventoryListSection
          title="Trackable Missing OG Items"
          items={ogMissingItemsAll}
          searchPlaceholder="Search missing OG items..."
          filterAriaLabel="Filter non-OG items by type"
          clearAriaLabel="Clear non-OG item search"
          emptyMessage="This player is the original owner of every item in Jailbreak."
          noResultsMessage="No items match your search."
          helperContent={
            unverifiableCount > 0 ? (
              <>
                <span>Unverifiable: </span>
                <span className="text-primary-text font-mono font-semibold tabular-nums">
                  {formatInventoryCount(unverifiableCount)}
                </span>{" "}
                <span>assumed owned. Hidden from missing list.</span>
                <button
                  type="button"
                  onClick={onViewUnverifiable}
                  className="text-link hover:text-link-hover ml-2 cursor-pointer underline underline-offset-2"
                >
                  View list
                </button>
              </>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
