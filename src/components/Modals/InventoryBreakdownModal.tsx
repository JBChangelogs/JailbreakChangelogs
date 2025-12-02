"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface InventoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  networth: number;
  inventoryCount: number;
  percentages: Record<string, number>;
  money?: number;
  inventoryValue?: number;
  duplicatesCount?: number;
  duplicatesValue?: number | null;
  duplicatesPercentages?: Record<string, number> | null;
}

export default function InventoryBreakdownModal({
  isOpen,
  onClose,
  username,
  networth,
  inventoryCount,
  percentages,
  money,
  inventoryValue,
  duplicatesCount,
  duplicatesValue,
  duplicatesPercentages,
}: InventoryBreakdownModalProps) {
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
    if (!percentages || !inventoryValue) return {};

    const categoryValues: Record<string, number> = {};

    Object.entries(percentages).forEach(([category, percentage]) => {
      categoryValues[category] = (percentage / 100) * inventoryValue;
    });

    return categoryValues;
  };

  const categoryValues = calculateCategoryValues();

  // Calculate duplicate category values
  const calculateDuplicateCategoryValues = (): Record<string, number> => {
    if (!duplicatesPercentages || !duplicatesValue) return {};

    const categoryValues: Record<string, number> = {};

    Object.entries(duplicatesPercentages).forEach(([category, percentage]) => {
      categoryValues[category] = (percentage / 100) * duplicatesValue;
    });

    return categoryValues;
  };

  const duplicateCategoryValues = calculateDuplicateCategoryValues();

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="modal-container bg-secondary-bg border-button-info flex max-h-[80vh] w-full max-w-[600px] min-w-[320px] flex-col overflow-hidden rounded-lg border shadow-lg">
          <div className="modal-header text-primary-text flex items-center justify-between px-6 py-4 text-xl font-semibold">
            <span>{username}&apos;s Inventory Breakdown</span>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text cursor-pointer p-1 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="modal-content flex-1 overflow-y-auto p-6">
            {/* Networth Summary */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-primary-bg border-border-primary rounded-lg border p-4 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  Total Networth
                </div>
                <div className="text-button-success text-xl font-bold">
                  ${formatNetworth(networth)}
                </div>
              </div>
              <div className="bg-primary-bg border-border-primary rounded-lg border p-4 text-center">
                <div className="text-secondary-text mb-1 text-sm">
                  Total Items
                </div>
                <div className="text-primary-text text-xl font-bold">
                  {formatInventoryCount(
                    inventoryCount + (duplicatesCount || 0),
                  )}
                </div>
              </div>
            </div>

            {/* Networth Breakdown */}
            {money !== undefined && inventoryValue !== undefined && (
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-primary-bg border-border-primary rounded-lg border p-4 text-center">
                    <div className="text-secondary-text mb-1 text-sm">Cash</div>
                    <div className="text-button-success text-lg font-bold">
                      ${formatNetworth(money)}
                    </div>
                  </div>
                  <div className="bg-primary-bg border-border-primary rounded-lg border p-4 text-center">
                    <div className="text-secondary-text mb-1 text-sm">
                      Inventory Value
                    </div>
                    <div className="text-button-success text-lg font-bold">
                      ${formatNetworth(inventoryValue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            <div className="mb-4">
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
                      .map(([category, percentage]) => {
                        const categoryIcon = getCategoryIcon(category);
                        return (
                          <div
                            key={category}
                            className="bg-primary-bg border-border-primary flex items-center justify-between gap-2 rounded border p-2 text-sm"
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
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-secondary-text font-semibold">
                                {formatPercentage(percentage)}%
                              </span>
                              {categoryValues[category] !== undefined && (
                                <span className="text-button-success text-xs font-medium">
                                  ${formatNetworth(categoryValues[category])}
                                </span>
                              )}
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

            {/* Duplicates Breakdown - Only show if duplicates data is available */}
            {duplicatesCount !== undefined &&
              duplicatesValue !== undefined &&
              duplicatesValue !== null &&
              duplicatesPercentages &&
              Object.keys(duplicatesPercentages).length > 0 && (
                <div className="mb-4 border-t border-border-primary pt-4">
                  <h4 className="text-primary-text mb-3 text-sm font-semibold">
                    Duplicates Breakdown
                  </h4>

                  {/* Duplicates Summary */}
                  <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-primary-bg border-border-primary rounded-lg border p-4 text-center">
                      <div className="text-secondary-text mb-1 text-sm">
                        Duplicated Items
                      </div>
                      <div className="text-primary-text text-xl font-bold">
                        {formatInventoryCount(duplicatesCount)}
                      </div>
                    </div>
                    <div className="bg-primary-bg border-border-primary rounded-lg border p-4 text-center">
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
                      .map(([category, percentage]) => {
                        const categoryIcon = getCategoryIcon(category);
                        return (
                          <div
                            key={category}
                            className="bg-primary-bg border-border-primary flex items-center justify-between gap-2 rounded border p-2 text-sm"
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
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-secondary-text font-semibold">
                                {formatPercentage(percentage)}%
                              </span>
                              {duplicateCategoryValues[category] !==
                                undefined && (
                                <span className="text-button-success text-xs font-medium">
                                  $
                                  {formatNetworth(
                                    duplicateCategoryValues[category],
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
