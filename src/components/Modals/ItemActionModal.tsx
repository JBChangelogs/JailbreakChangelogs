"use client";

import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface ItemActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    title: string;
    categoryTitle?: string;
    history?: Array<{ UserId: number; TradeTime: number }> | string;
  } | null;
  onViewTradeHistory: () => void;
}

export default function ItemActionModal({
  isOpen,
  onClose,
  item,
  onViewTradeHistory,
}: ItemActionModalProps) {
  const router = useRouter();

  if (!item) return null;

  const handleViewItemPage = () => {
    onClose();
    // Navigate to item page - we'll need to construct the URL based on item data
    // For now, we'll use a generic approach
    router.push(
      `/item/${encodeURIComponent(item.categoryTitle?.toLowerCase() || "unknown")}/${encodeURIComponent(item.title)}`,
    );
  };

  const handleViewTradeHistory = () => {
    onClose();
    onViewTradeHistory();
  };

  const hasTradeHistory =
    item.history && Array.isArray(item.history) && item.history.length > 1;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="modal-container bg-secondary-bg border-button-info mx-auto max-h-[80vh] w-full max-w-sm overflow-hidden rounded-lg border shadow-lg sm:max-w-md">
          {/* Modal Header */}
          <div className="modal-header text-primary-text border-border-primary hover:border-border-focus px-4 py-4 text-lg font-semibold sm:px-6 sm:text-xl">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-primary-text text-lg font-semibold sm:text-xl">
                  Item Actions
                </Dialog.Title>
                <p className="text-secondary-text truncate text-sm">
                  {item.title} {item.categoryTitle && `(${item.categoryTitle})`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text rounded-full p-1"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="modal-content p-4 sm:p-6">
            <div className="space-y-3">
              {/* View Item Page */}
              <button
                onClick={handleViewItemPage}
                className="bg-primary-bg text-primary-text border-border-primary flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors sm:p-4"
              >
                <div>
                  <div className="text-sm font-medium sm:text-base">
                    View Item Page
                  </div>
                  <div className="text-secondary-text text-xs sm:text-sm">
                    See detailed item information, values, and statistics
                  </div>
                </div>
              </button>

              {/* View Trade History */}
              {hasTradeHistory ? (
                <button
                  onClick={handleViewTradeHistory}
                  className="bg-primary-bg text-primary-text border-border-primary flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors sm:p-4"
                >
                  <div>
                    <div className="font-medium">View Ownership History</div>
                    <div className="text-secondary-text text-sm">
                      View ownership history for this item
                    </div>
                  </div>
                </button>
              ) : (
                <div className="bg-primary-bg text-tertiary-text border-border-primary flex w-full cursor-not-allowed items-center gap-3 rounded-lg border p-3 text-left sm:p-4">
                  <div>
                    <div className="font-medium">No Ownership History</div>
                    <div className="text-quaternary-text text-sm">
                      This item has no ownership history
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
