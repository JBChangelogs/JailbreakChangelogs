import type { ReactNode } from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { Icon } from "@/components/ui/IconWrapper";
import type { ChartConfig } from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatNetworth,
  formatPercentage,
} from "@/components/Inventory/Breakdown/constants";
import CategoryPieCard from "@/components/Inventory/Breakdown/CategoryPieCard";
import CategoryProgressBar from "@/components/Inventory/Breakdown/CategoryProgressBar";

interface ValueChartEntry {
  category: string;
  value: number;
  amount?: number;
  fill: string;
}

interface ValueBreakdownSectionProps {
  title: string;
  pieTitle: string;
  tooltipContent: ReactNode;
  percentages: Record<string, number>;
  categoryValues: Record<string, number>;
  sortedEntries: [string, number][];
  chartData: ValueChartEntry[];
  chartConfig: ChartConfig;
  emptyMessage: string;
  renderCharts: boolean;
  layoutVariant: "inventory" | "duplicates";
}

export default function ValueBreakdownSection({
  title,
  pieTitle,
  tooltipContent,
  percentages,
  categoryValues,
  sortedEntries,
  chartData,
  chartConfig,
  emptyMessage,
  renderCharts,
  layoutVariant,
}: ValueBreakdownSectionProps) {
  const isInventory = layoutVariant === "inventory";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div
        className={isInventory ? "space-y-6 xl:col-span-8" : "xl:col-span-8"}
      >
        <div
          className={
            isInventory
              ? "border-border-card bg-secondary-bg rounded-lg border p-4"
              : "border-border-card bg-secondary-bg space-y-4 rounded-lg border p-4"
          }
        >
          <div
            className={
              isInventory
                ? "mb-3 flex items-center gap-1.5"
                : "flex items-center gap-1.5"
            }
          >
            <h4 className="text-primary-text text-sm font-semibold">{title}</h4>
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
                {tooltipContent}
              </TooltipContent>
            </Tooltip>
          </div>
          {Object.keys(percentages).length > 0 ? (
            <>
              <CategoryProgressBar
                entries={sortedEntries.map(([category, percentage]) => ({
                  key: category,
                  label: category,
                  widthPercent: percentage,
                  color: getCategoryColor(category),
                  tooltip: (
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
                        <span className="text-secondary-text">Percentage</span>
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
                  ),
                }))}
                emptyMessage={emptyMessage}
                className={isInventory ? "mb-4" : undefined}
              />

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {sortedEntries.map(([category, percentage]) => {
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
              <p className="text-secondary-text">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>

      <div className="xl:col-span-4">
        <CategoryPieCard
          title={pieTitle}
          chartConfig={chartConfig}
          data={chartData}
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
  );
}
