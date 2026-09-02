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

interface OgOwnedSectionProps {
  itemsAvailable: boolean;
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
  itemsAvailable,
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

          {!itemsAvailable ? (
            <div className="py-6 text-center">
              <p className="text-secondary-text text-sm">
                Item list unavailable, can&apos;t calculate OG owned.
              </p>
            </div>
          ) : (
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
                          ),
                        }))
                    : []
                }
                emptyMessage="No items owned"
              />

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
  );
}
