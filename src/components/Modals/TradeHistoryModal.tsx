"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { DefaultAvatar } from "@/utils/avatar";
import { getCategoryColor } from "@/utils/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface Item {
  title: string;
  categoryTitle?: string;
  history?: TradeHistoryEntry[] | string;
}

interface TradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  getUserAvatar: (userId: string) => string | null;
  getUserDisplay: (userId: string) => string;
  formatDate: (timestamp: number) => string;
  loadingUserIds?: Set<string>;
  getUsername?: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
}

export default function TradeHistoryModal({
  isOpen,
  onClose,
  item,
  getUserAvatar,
  getUserDisplay,
  formatDate,
  loadingUserIds = new Set(),
  getUsername,
  getHasVerifiedBadge,
}: TradeHistoryModalProps) {
  const [tradeSortOrder, setTradeSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );

  const toggleTradeSortOrder = () => {
    setTradeSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="border-border-primary bg-secondary-bg mx-auto max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border">
          {/* Modal Header */}
          <div className="border-border-primary border-b p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-primary-text text-lg font-semibold sm:text-xl">
                  Ownership History
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <p className="text-primary-text truncate text-sm">
                    {item.title}
                  </p>
                  {item.categoryTitle && (
                    <span
                      className="text-primary-text flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: getCategoryColor(item.categoryTitle),
                        backgroundColor:
                          getCategoryColor(item.categoryTitle) + "20", // Add 20% opacity
                      }}
                    >
                      {item.categoryTitle}
                    </span>
                  )}
                </div>
                {/* Loading indicator in header */}
                {loadingUserIds.size > 0 && (
                  <div className="text-button-info mt-2 flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-secondary-text text-sm">
                      Loading user profiles...
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text rounded-full p-1 transition-colors cursor-pointer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Sort button - below on mobile, inline on desktop */}
            {item.history &&
              Array.isArray(item.history) &&
              item.history.length > 1 && (
                <div className="mt-3 flex justify-start">
                  <button
                    onClick={toggleTradeSortOrder}
                    className="bg-button-info text-form-button-text hover:bg-button-info-hover border-border-primary flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                  >
                    {tradeSortOrder === "newest" ? (
                      <ArrowDownIcon className="h-4 w-4" />
                    ) : (
                      <ArrowUpIcon className="h-4 w-4" />
                    )}
                    {tradeSortOrder === "newest"
                      ? "Newest First"
                      : "Oldest First"}
                  </button>
                </div>
              )}
          </div>

          {/* Modal Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {/* Notice for items with 49+ history entries */}
            {item.history &&
              Array.isArray(item.history) &&
              item.history.length >= 49 && (
                <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-4">
                  <div className="text-primary-text mb-3 flex items-center gap-2 text-sm">
                    <span className="font-medium">Ownership History Limit</span>
                  </div>
                  <div className="text-secondary-text space-y-1 text-sm">
                    <div>
                      Due to Badimo restrictions, we can only display{" "}
                      <span className="text-primary-text font-semibold">
                        49
                      </span>{" "}
                      ownership history entries.
                    </div>
                    <div>
                      This item has{" "}
                      <span className="text-primary-text font-semibold">
                        49
                      </span>{" "}
                      total history entries, but only the most recent{" "}
                      <span className="text-primary-text font-semibold">
                        49
                      </span>{" "}
                      are shown below.
                    </div>
                  </div>
                </div>
              )}

            {(() => {
              // Check if we have valid history data
              if (
                !item.history ||
                !Array.isArray(item.history) ||
                item.history.length === 0
              ) {
                return (
                  <div className="py-8 text-center">
                    <p className="text-secondary-text">
                      This item has no ownership history.
                    </p>
                  </div>
                );
              }

              // Process history to show actual trades between users
              const history = item.history.slice().reverse();

              // If there's only one history entry, show no ownership history message
              if (history.length === 1) {
                return (
                  <div className="py-8 text-center">
                    <p className="text-secondary-text">
                      This item has no ownership history.
                    </p>
                  </div>
                );
              }

              // Group history into trades between users
              const trades = [];
              for (let i = 0; i < history.length - 1; i++) {
                const toUser = history[i];
                const fromUser = history[i + 1];
                trades.push({
                  fromUser,
                  toUser,
                  tradeNumber: history.length - i - 1,
                });
              }

              // Sort trades based on sort order
              const sortedTrades = [...trades].sort((a, b) => {
                const dateA = a.toUser.TradeTime;
                const dateB = b.toUser.TradeTime;
                return tradeSortOrder === "newest"
                  ? dateB - dateA
                  : dateA - dateB;
              });

              // Find the first trade (lowest trade number = chronologically oldest)
              const firstTradeNumber = Math.min(
                ...trades.map((trade) => trade.tradeNumber),
              );

              return (
                <div className="space-y-3">
                  {sortedTrades.map((trade) => {
                    return (
                      <div
                        key={`${trade.fromUser.UserId}-${trade.toUser.UserId}-${trade.toUser.TradeTime}`}
                        className={`rounded-lg border p-3 ${
                          trade.tradeNumber === firstTradeNumber
                            ? "bg-primary-bg border-yellow-500 shadow-lg ring-2 ring-yellow-500/20"
                            : "border-border-primary bg-primary-bg"
                        }`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* From User */}
                                <div className="flex items-center gap-2">
                                  <div className="border-border-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border">
                                    {getUserAvatar(
                                      trade.fromUser.UserId.toString(),
                                    ) ? (
                                      <Image
                                        src={
                                          getUserAvatar(
                                            trade.fromUser.UserId.toString(),
                                          )!
                                        }
                                        alt="User Avatar"
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <DefaultAvatar />
                                    )}
                                  </div>
                                  <a
                                    href={`https://www.roblox.com/users/${trade.fromUser.UserId}/profile`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-link hover:text-link-hover truncate font-medium transition-colors hover:underline"
                                  >
                                    <span className="inline-flex items-center gap-1.5">
                                      {getUsername
                                        ? getUsername(
                                            trade.fromUser.UserId.toString(),
                                          )
                                        : getUserDisplay(
                                            trade.fromUser.UserId.toString(),
                                          )}
                                      {getHasVerifiedBadge &&
                                        getHasVerifiedBadge(
                                          trade.fromUser.UserId.toString(),
                                        ) && (
                                          <VerifiedBadgeIcon className="h-4 w-4" />
                                        )}
                                    </span>
                                  </a>
                                </div>

                                {/* Arrow */}
                                <div className="text-secondary-text flex items-center gap-1">
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                  </svg>
                                  <span
                                    className={`text-xs ${trade.tradeNumber === firstTradeNumber ? "font-bold text-yellow-500" : ""}`}
                                  >
                                    Trade #{trade.tradeNumber}
                                  </span>
                                </div>

                                {/* To User */}
                                <div className="flex items-center gap-2">
                                  <div className="border-border-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border">
                                    {getUserAvatar(
                                      trade.toUser.UserId.toString(),
                                    ) ? (
                                      <Image
                                        src={
                                          getUserAvatar(
                                            trade.toUser.UserId.toString(),
                                          )!
                                        }
                                        alt="User Avatar"
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <DefaultAvatar />
                                    )}
                                  </div>
                                  <a
                                    href={`https://www.roblox.com/users/${trade.toUser.UserId}/profile`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-link hover:text-link-hover truncate font-medium transition-colors hover:underline"
                                  >
                                    <span className="inline-flex items-center gap-1.5">
                                      {getUsername
                                        ? getUsername(
                                            trade.toUser.UserId.toString(),
                                          )
                                        : getUserDisplay(
                                            trade.toUser.UserId.toString(),
                                          )}
                                      {getHasVerifiedBadge &&
                                        getHasVerifiedBadge(
                                          trade.toUser.UserId.toString(),
                                        ) && (
                                          <VerifiedBadgeIcon className="h-4 w-4" />
                                        )}
                                    </span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Trade Date */}
                          <div className="text-secondary-text flex-shrink-0 text-sm">
                            {formatDate(trade.toUser.TradeTime)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
