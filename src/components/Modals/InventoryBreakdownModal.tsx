"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { getCategoryColor } from "@/utils/categoryIcons";

interface InventoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  networth: number;
  inventoryCount: number;
  percentages: Record<string, number>;
  money?: number;
  inventoryValue?: number;
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
}: InventoryBreakdownModalProps) {
  // Format large numbers with commas for better readability
  const formatNetworth = (networth: number) => {
    return new Intl.NumberFormat("en-US").format(networth);
  };

  const formatInventoryCount = (count: number) => {
    return new Intl.NumberFormat("en-US").format(count);
  };

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
                  {formatInventoryCount(inventoryCount)}
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
                        <div
                          key={category}
                          className="group relative"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category),
                          }}
                          title={`${category}: ${percentage.toFixed(2)}%`}
                        ></div>
                      ))}
                  </div>

                  {/* Category grid with color indicators */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Object.entries(percentages)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, percentage]) => (
                        <div
                          key={category}
                          className="bg-primary-bg border-border-primary flex items-center justify-between gap-2 rounded border p-2 text-sm"
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
                            {percentage.toFixed(1)}%
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
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
