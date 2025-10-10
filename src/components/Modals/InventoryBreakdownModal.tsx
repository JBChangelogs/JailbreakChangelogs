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
        <DialogPanel className="modal-container bg-secondary-bg border-button-info w-full max-w-[600px] min-w-[320px] max-h-[80vh] rounded-lg border shadow-lg overflow-hidden flex flex-col">
          <div className="modal-header text-primary-text px-6 py-4 text-xl font-semibold flex items-center justify-between">
            <span>{username}&apos;s Inventory Breakdown</span>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary-text hover:text-primary-text transition-colors p-1 cursor-pointer"
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

          <div className="modal-content p-6 overflow-y-auto flex-1">
            {/* Networth Summary */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="mb-4 h-8 w-full overflow-hidden rounded bg-secondary-bg flex">
                    {Object.entries(percentages)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, percentage]) => (
                        <div
                          key={category}
                          className="relative group"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getCategoryColor(category),
                          }}
                          title={`${category}: ${percentage.toFixed(2)}%`}
                        ></div>
                      ))}
                  </div>

                  {/* Category grid with color indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(percentages)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, percentage]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between gap-2 text-sm p-2 bg-primary-bg rounded border border-border-primary"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
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
                <div className="text-center py-8">
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
