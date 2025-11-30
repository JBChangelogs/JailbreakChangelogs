"use client";

import { getCategoryColor } from "@/utils/categoryIcons";
import { UserNetworthData } from "@/utils/api";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface InventoryBreakdownProps {
  networthData: UserNetworthData[];
  username: string;
}

export default function InventoryBreakdown({
  networthData,
}: InventoryBreakdownProps) {
  // Get the latest networth data (highest snapshot_time)
  const latestData =
    networthData && networthData.length > 0
      ? networthData.reduce((latest, current) =>
          current.snapshot_time > latest.snapshot_time ? current : latest,
        )
      : null;

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

  if (!latestData || !latestData.percentages) {
    return (
      <div className="bg-secondary-bg border-border-primary rounded-lg border p-8 text-center">
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

  // Calculate total items including duplicates
  const totalItems = inventory_count + (duplicatesCount || 0);

  return (
    <div className="space-y-6">
      {/* Networth Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-secondary-bg border-border-primary rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-1 text-sm">Total Networth</div>
          <div className="text-button-success text-xl font-bold">
            ${formatNetworth(networth)}
          </div>
        </div>
        <div className="bg-secondary-bg border-border-primary rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-1 text-sm">Total Items</div>
          <div className="text-primary-text text-xl font-bold">
            {formatInventoryCount(totalItems)}
          </div>
        </div>
      </div>

      {/* Networth Breakdown */}
      {money !== undefined && inventory_value !== undefined && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-secondary-bg border-border-primary rounded-lg border p-4 text-center">
              <div className="text-secondary-text mb-1 text-sm">Cash</div>
              <div className="text-button-success text-lg font-bold">
                ${formatNetworth(money)}
              </div>
            </div>
            <div className="bg-secondary-bg border-border-primary rounded-lg border p-4 text-center">
              <div className="text-secondary-text mb-1 text-sm">
                Inventory Value
              </div>
              <div className="text-button-success text-lg font-bold">
                ${formatNetworth(inventory_value)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div>
        <h4 className="text-primary-text mb-3 text-sm font-semibold">
          Category Breakdown
        </h4>

        {Object.keys(percentages).length > 0 ? (
          <>
            {/* Stacked bar chart showing category percentages */}
            <div className="bg-secondary-bg mb-4 flex h-8 w-full overflow-hidden rounded">
              {Object.entries(percentages)
                .sort(([, a], [, b]) => b - a)
                .map(([category, percentage]) => (
                  <Tooltip
                    key={category}
                    title={`${category}: ${formatPercentage(percentage)}%`}
                    placement="top"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "var(--color-secondary-bg)",
                          color: "var(--color-primary-text)",
                          "& .MuiTooltip-arrow": {
                            color: "var(--color-secondary-bg)",
                          },
                        },
                      },
                    }}
                  >
                    <div
                      className="group relative"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getCategoryColor(category),
                      }}
                    ></div>
                  </Tooltip>
                ))}
            </div>

            {/* Category grid with color indicators */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(percentages)
                .sort(([, a], [, b]) => b - a)
                .map(([category, percentage]) => (
                  <div
                    key={category}
                    className="bg-secondary-bg border-border-primary flex items-center justify-between gap-2 rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded-sm"
                        style={{
                          backgroundColor: getCategoryColor(category),
                        }}
                      />
                      <span className="text-primary-text font-medium">
                        {category}
                      </span>
                    </div>
                    <span className="text-secondary-text font-semibold">
                      {formatPercentage(percentage)}%
                    </span>
                  </div>
                ))}
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

      {/* Duplicates Breakdown - Only show if duplicates data is available */}
      {duplicatesCount !== undefined &&
        duplicatesValue !== undefined &&
        duplicatesValue !== null &&
        duplicatesPercentages &&
        Object.keys(duplicatesPercentages).length > 0 && (
          <div className="border-t border-border-primary pt-6">
            <h4 className="text-primary-text mb-3 text-sm font-semibold">
              Duplicates Breakdown
            </h4>

            {/* Duplicates Summary */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-secondary-bg border-border-primary rounded-lg border p-4 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  Duplicated Items
                </div>
                <div className="text-primary-text text-xl font-bold">
                  {formatInventoryCount(duplicatesCount)}
                </div>
              </div>
              <div className="bg-secondary-bg border-border-primary rounded-lg border p-4 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  Duplicates Value
                </div>
                <div className="text-button-success text-xl font-bold">
                  ${formatNetworth(duplicatesValue)}
                </div>
              </div>
            </div>

            {/* Stacked bar chart showing duplicates category percentages */}
            <div className="bg-secondary-bg mb-4 flex h-8 w-full overflow-hidden rounded">
              {Object.entries(duplicatesPercentages)
                .sort(([, a], [, b]) => b - a)
                .map(([category, percentage]) => (
                  <Tooltip
                    key={category}
                    title={`${category}: ${formatPercentage(percentage)}%`}
                    placement="top"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "var(--color-secondary-bg)",
                          color: "var(--color-primary-text)",
                          "& .MuiTooltip-arrow": {
                            color: "var(--color-secondary-bg)",
                          },
                        },
                      },
                    }}
                  >
                    <div
                      className="group relative"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getCategoryColor(category),
                      }}
                    ></div>
                  </Tooltip>
                ))}
            </div>

            {/* Duplicates category grid with color indicators */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(duplicatesPercentages)
                .sort(([, a], [, b]) => b - a)
                .map(([category, percentage]) => (
                  <div
                    key={category}
                    className="bg-secondary-bg border-border-primary flex items-center justify-between gap-2 rounded border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded-sm"
                        style={{
                          backgroundColor: getCategoryColor(category),
                        }}
                      />
                      <span className="text-primary-text font-medium">
                        {category}
                      </span>
                    </div>
                    <span className="text-secondary-text font-semibold">
                      {formatPercentage(percentage)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
}
