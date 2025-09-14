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
        <div className="mx-auto max-h-[80vh] w-full max-w-sm overflow-hidden rounded-lg border border-[#5865F2] bg-[#2E3944] sm:max-w-md">
          {/* Modal Header */}
          <div className="border-b border-[#2E3944] bg-[#212A31] p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-muted text-lg font-semibold sm:text-xl">
                  Item Actions
                </Dialog.Title>
                <p className="text-muted truncate text-sm opacity-75">
                  {item.title} {item.categoryTitle && `(${item.categoryTitle})`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted rounded-full p-1 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {/* View Item Page */}
              <button
                onClick={handleViewItemPage}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#2E3944] bg-[#212A31] p-3 text-left text-white transition-colors sm:p-4"
              >
                <div>
                  <div className="text-sm font-medium sm:text-base">
                    View Item Page
                  </div>
                  <div className="text-xs text-gray-400 sm:text-sm">
                    See detailed item information, values, and statistics
                  </div>
                </div>
              </button>

              {/* View Trade History */}
              {hasTradeHistory ? (
                <button
                  onClick={handleViewTradeHistory}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#2E3944] bg-[#212A31] p-3 text-left text-white transition-colors sm:p-4"
                >
                  <div>
                    <div className="font-medium">View Trade History</div>
                    <div className="text-sm text-gray-400">
                      View trade history for this item
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex w-full items-center gap-3 rounded-lg border border-[#2E3944] bg-[#212A31] p-3 text-left text-gray-500 sm:p-4">
                  <div>
                    <div className="font-medium">No Trade History</div>
                    <div className="text-sm text-gray-500">
                      This item has no trade history
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
