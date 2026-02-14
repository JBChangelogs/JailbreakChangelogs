"use client";

import { useEffect, useState } from "react";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { UserNetworthData } from "@/utils/api";
import { Icon } from "@/components/ui/IconWrapper";
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

interface InventoryBreakdownProps {
  networthData: UserNetworthData[];
  username: string;
}

const MIN_PIE_LABEL_PERCENT = 1;

export default function InventoryBreakdown({
  networthData,
}: InventoryBreakdownProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateMobileState = () => setIsMobile(mediaQuery.matches);

    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);

    return () => mediaQuery.removeEventListener("change", updateMobileState);
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <h4 className="text-primary-text mb-3 text-sm font-semibold">
              Overview
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  Total Items
                </div>
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

          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <h4 className="text-primary-text mb-3 text-sm font-semibold">
              Category Breakdown
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
                Category Pie Chart
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
                  innerRadius={70}
                  outerRadius={110}
                  strokeWidth={2}
                  labelLine={
                    isMobile
                      ? false
                      : {
                          stroke: "var(--color-secondary-text)",
                          strokeWidth: 1,
                          opacity: 0.7,
                        }
                  }
                  label={({ name, value }) => {
                    if (isMobile) return "";
                    const percent = Number(value);
                    if (!Number.isFinite(percent)) return "";
                    if (percent < MIN_PIE_LABEL_PERCENT) return "";
                    return `${name} ${formatPercentage(percent)}%`;
                  }}
                >
                  {categoryChartData.map((entry) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
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
                  Duplicates Breakdown
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
                    Duplicates Pie Chart
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
                      innerRadius={70}
                      outerRadius={110}
                      strokeWidth={2}
                      labelLine={
                        isMobile
                          ? false
                          : {
                              stroke: "var(--color-secondary-text)",
                              strokeWidth: 1,
                              opacity: 0.7,
                            }
                      }
                      label={({ name, value }) => {
                        if (isMobile) return "";
                        const percent = Number(value);
                        if (!Number.isFinite(percent)) return "";
                        if (percent < MIN_PIE_LABEL_PERCENT) return "";
                        return `${name} ${formatPercentage(percent)}%`;
                      }}
                    >
                      {duplicatesChartData.map((entry) => (
                        <Cell key={entry.category} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
