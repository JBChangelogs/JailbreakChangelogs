"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import {
  XMarkIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getCategoryColor } from "@/utils/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { fetchRobloxAvatars, fetchRobloxUsersBatch } from "@/utils/api";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface AvatarData {
  targetId: number;
  state: string;
  imageUrl?: string;
  version: string;
}

interface UserData {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
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
}

export default function TradeHistoryModal({
  isOpen,
  onClose,
  item,
}: TradeHistoryModalProps) {
  const [tradeSortOrder, setTradeSortOrder] = useState<"newest" | "oldest">(
    "newest",
  );

  const tradeHistoryUserIds = useMemo(() => {
    if (!item?.history || !Array.isArray(item.history)) {
      return [];
    }

    const userIds = new Set<string>();
    item.history.forEach((entry) => {
      userIds.add(entry.UserId.toString());
    });

    return Array.from(userIds);
  }, [item]);

  const { data: tradeHistoryAvatars } = useQuery({
    queryKey: ["tradeHistoryAvatars", tradeHistoryUserIds.sort()],
    queryFn: async () => {
      if (tradeHistoryUserIds.length === 0) {
        return {};
      }

      const avatarData = await fetchRobloxAvatars(tradeHistoryUserIds);
      if (!avatarData) {
        return {};
      }

      const processedAvatars: Record<string, string> = {};
      Object.values(avatarData).forEach((avatar) => {
        if (
          avatar &&
          typeof avatar === "object" &&
          "targetId" in avatar &&
          "state" in avatar &&
          "imageUrl" in avatar
        ) {
          const typedAvatar = avatar as AvatarData;
          if (
            typedAvatar.targetId &&
            typedAvatar.state === "Completed" &&
            typedAvatar.imageUrl
          ) {
            processedAvatars[typedAvatar.targetId.toString()] =
              typedAvatar.imageUrl;
          }
        }
      });

      return processedAvatars;
    },
    enabled: tradeHistoryUserIds.length > 0 && isOpen,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const { data: tradeHistoryUsers } = useQuery({
    queryKey: ["tradeHistoryUsers", tradeHistoryUserIds.sort()],
    queryFn: async () => {
      if (tradeHistoryUserIds.length === 0) {
        return {};
      }

      const userData = await fetchRobloxUsersBatch(tradeHistoryUserIds);
      if (!userData) {
        return {};
      }

      const processedUsers: Record<
        string,
        { name: string; displayName: string; hasVerifiedBadge: boolean }
      > = {};
      Object.values(userData).forEach((user: UserData) => {
        if (user && user.id) {
          processedUsers[user.id.toString()] = {
            name: user.name || user.id.toString(),
            displayName: user.displayName || user.name || user.id.toString(),
            hasVerifiedBadge: Boolean(user.hasVerifiedBadge),
          };
        }
      });

      return processedUsers;
    },
    enabled: tradeHistoryUserIds.length > 0 && isOpen,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const getUsername = (userId: string) => {
    const cachedUser = tradeHistoryUsers?.[userId];
    if (cachedUser) {
      return cachedUser.name;
    }

    return userId;
  };

  const getHasVerifiedBadge = (userId: string) => {
    const cachedUser = tradeHistoryUsers?.[userId];
    if (cachedUser) {
      return cachedUser.hasVerifiedBadge;
    }

    return false;
  };

  const getUserAvatar = (userId: string) => {
    return tradeHistoryAvatars?.[userId] || "";
  };

  const DefaultAvatar = () => (
    <svg
      className="h-6 w-6 text-tertiary-text"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
        clipRule="evenodd"
      />
    </svg>
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
                          getCategoryColor(item.categoryTitle) + "20",
                      }}
                    >
                      {item.categoryTitle}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

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

          <div className="max-h-[60vh] overflow-y-auto p-6">
            {item.history &&
              Array.isArray(item.history) &&
              item.history.length >= 49 && (
                <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-4">
                  <div className="text-primary-text mb-2 flex items-center gap-2 text-sm">
                    <span className="font-medium">Data Limitation</span>
                  </div>
                  <div className="text-secondary-text text-sm">
                    Badimo&apos;s data only provides the most recent{" "}
                    <span className="text-primary-text font-semibold">49</span>{" "}
                    trades for this item.
                  </div>
                </div>
              )}

            {(() => {
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

              const history = item.history.slice().reverse();

              if (history.length === 1) {
                return (
                  <div className="py-8 text-center">
                    <p className="text-secondary-text">
                      This item has no ownership history.
                    </p>
                  </div>
                );
              }

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

              const sortedTrades = [...trades].sort((a, b) => {
                const dateA = a.toUser.TradeTime;
                const dateB = b.toUser.TradeTime;
                return tradeSortOrder === "newest"
                  ? dateB - dateA
                  : dateA - dateB;
              });

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
                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
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
                                        className="rounded-full bg-tertiary-bg"
                                      />
                                    ) : (
                                      <div className="bg-tertiary-bg flex h-6 w-6 items-center justify-center rounded-full">
                                        <DefaultAvatar />
                                      </div>
                                    )}
                                  </div>
                                  <a
                                    href={`https://www.roblox.com/users/${trade.fromUser.UserId}/profile`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-link hover:text-link-hover truncate font-medium transition-colors hover:underline"
                                  >
                                    <span className="inline-flex items-center gap-1.5">
                                      {getUsername(
                                        trade.fromUser.UserId.toString(),
                                      )}
                                      {getHasVerifiedBadge(
                                        trade.fromUser.UserId.toString(),
                                      ) && (
                                        <VerifiedBadgeIcon className="h-4 w-4" />
                                      )}
                                    </span>
                                  </a>
                                </div>

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

                                <div className="flex items-center gap-2">
                                  <div className="flex-shrink-0">
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
                                        className="rounded-full bg-tertiary-bg"
                                      />
                                    ) : (
                                      <div className="bg-tertiary-bg flex h-6 w-6 items-center justify-center rounded-full">
                                        <DefaultAvatar />
                                      </div>
                                    )}
                                  </div>
                                  <a
                                    href={`https://www.roblox.com/users/${trade.toUser.UserId}/profile`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-link hover:text-link-hover truncate font-medium transition-colors hover:underline"
                                  >
                                    <span className="inline-flex items-center gap-1.5">
                                      {getUsername(
                                        trade.toUser.UserId.toString(),
                                      )}
                                      {getHasVerifiedBadge(
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
