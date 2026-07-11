"use client";

import { createLogger } from "@/services/logger";
import { useMemo, useState, useEffect } from "react";

const log = createLogger("UI");
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { RobloxUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface Item {
  title: string;
  categoryTitle?: string;
  history?: TradeHistoryEntry[] | string;
  id?: string;
}

interface TradeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  username?: string;
  isDupeTab?: boolean;
  usersData?: Record<string, RobloxUser>;
}

const getUserAvatar = (userId: string) => {
  return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
};

const TradeAvatarImage = ({ userId }: { userId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  return (
    <div className="bg-quaternary-bg relative h-10 w-10 overflow-hidden rounded-full">
      {avatarError ? (
        <DefaultAvatar name={userId} />
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="h-5 w-5" />
            </div>
          )}
          <Image
            src={getUserAvatar(userId)}
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setAvatarError(true);
            }}
          />
        </>
      )}
    </div>
  );
};

export default function TradeHistoryModal({
  isOpen,
  onClose,
  item,
  username,
  isDupeTab = false,
  usersData,
}: TradeHistoryModalProps) {
  const pathname = usePathname();

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

  // Process specific user data from props if available
  const memoizedUserData = useMemo(() => {
    if (!usersData) return {};

    const processed: Record<
      string,
      { name: string; displayName: string; hasVerifiedBadge: boolean }
    > = {};

    Object.values(usersData).forEach((user) => {
      const userIdStr = String(user.id);
      if (tradeHistoryUserIds.includes(userIdStr)) {
        processed[userIdStr] = {
          name: user.name || userIdStr,
          displayName: user.displayName || user.name || userIdStr,
          hasVerifiedBadge: Boolean(user.hasVerifiedBadge),
        };
      }
    });

    return processed;
  }, [usersData, tradeHistoryUserIds]);

  const [fetchedUsers, setFetchedUsers] = useState<
    Record<
      string,
      { name: string; displayName: string; hasVerifiedBadge: boolean }
    >
  >({});

  // Use either the passed data or the fetched data
  const finalUsers = usersData ? memoizedUserData : fetchedUsers;

  useEffect(() => {
    if (!isOpen) return;

    // If we have usersData via props, we don't need to fetch
    if (usersData) {
      return;
    }

    if (tradeHistoryUserIds.length === 0) {
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/v2`,
          {
            method: "POST",
            headers: {
              "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
              "X-Source":
                process.env.NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER ?? "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userIds: tradeHistoryUserIds }),
          },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          log.error("fetch trade history users failed", {
            status: response.status,
            body,
          });
          return;
        }

        const userData = await response.json();
        const processedUsers: Record<
          string,
          { name: string; displayName: string; hasVerifiedBadge: boolean }
        > = {};

        Object.values(userData).forEach((user) => {
          if (user && typeof user === "object" && "id" in user) {
            // Cast to partial RobloxUser to access properties safely
            const typedUser = user as RobloxUser;
            if (typedUser.id) {
              processedUsers[typedUser.id.toString()] = {
                name: typedUser.name || typedUser.id.toString(),
                displayName:
                  typedUser.displayName ||
                  typedUser.name ||
                  typedUser.id.toString(),
                hasVerifiedBadge: Boolean(typedUser.hasVerifiedBadge),
              };
            }
          }
        });

        setFetchedUsers(processedUsers);
      } catch (error) {
        log.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, [isOpen, tradeHistoryUserIds, usersData]);

  const getUsername = (userId: string) => {
    const cachedUser = finalUsers[userId];
    if (cachedUser) {
      return cachedUser.name;
    }

    return userId;
  };

  const getHasVerifiedBadge = (userId: string) => {
    const cachedUser = finalUsers[userId];
    if (cachedUser) {
      return cachedUser.hasVerifiedBadge;
    }

    return false;
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-secondary-bg max-w-4xl rounded-lg p-0 backdrop-blur-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-primary-text text-lg font-semibold sm:text-xl">
                {username
                  ? `${username}'s ${item.title} ownership history`
                  : `${item.title}'s Ownership History`}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {item.categoryTitle && (
                  <span
                    className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                    style={{
                      borderColor: getCategoryColor(item.categoryTitle),
                    }}
                  >
                    {(() => {
                      const categoryIcon = getCategoryIcon(item.categoryTitle);
                      return categoryIcon ? (
                        <categoryIcon.Icon
                          className="h-3 w-3"
                          style={{
                            color: getCategoryColor(item.categoryTitle),
                          }}
                        />
                      ) : null;
                    })()}
                    {item.categoryTitle}
                  </span>
                )}
              </div>
              {tradeHistoryUserIds.length > 0 && (
                <p className="text-secondary-text mt-1 text-sm">
                  History of {tradeHistoryUserIds.length} owners
                </p>
              )}
            </div>
          </div>

          {item.id && (pathname?.startsWith("/dupes") || isDupeTab) && (
            <div className="bg-button-info/10 border-border-card mx-0 mt-4 mb-2 flex flex-col items-center justify-between gap-4 rounded-lg border p-3 sm:flex-row">
              <div className="flex items-start gap-2">
                <div className="text-sm">
                  <p className="text-primary-text font-semibold">
                    Think this might be a false dupe?
                  </p>
                  <p className="text-secondary-text">
                    Compare this item&apos;s history side-by-side with its
                    original variant.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="default"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
              >
                <a
                  href={`/dupes/compare?id=${encodeURIComponent(item.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Compare Variants
                </a>
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="max-h-[calc(80vh-200px)] overflow-y-auto px-6 pt-4 pb-6">
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

            const owners = item.history.slice();

            if (owners.length === 0) {
              return (
                <div className="py-8 text-center">
                  <p className="text-secondary-text">
                    This item has no ownership history.
                  </p>
                </div>
              );
            }

            if (owners.length === 1) {
              return (
                <div className="py-8 text-center">
                  <p className="text-secondary-text">
                    This item has no trade history yet — it has never been
                    traded.
                  </p>
                </div>
              );
            }

            const isCapped = owners.length >= 49;

            if (!isCapped) {
              // Build paired trades: history[i] received from history[i+1]
              const trades = [];
              for (let i = 0; i < owners.length - 1; i++) {
                trades.push({
                  fromUser: owners[i],
                  toUser: owners[i + 1],
                  tradeNumber: i + 1,
                });
              }
              const firstTradeNumber = 1;

              return (
                <div className="space-y-2">
                  {trades.map((trade) => {
                    const fromId = trade.fromUser.UserId.toString();
                    const toId = trade.toUser.UserId.toString();
                    return (
                      <div
                        key={`${fromId}-${toId}-${trade.toUser.TradeTime}`}
                        className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center ${
                          trade.tradeNumber === firstTradeNumber
                            ? "border-[#FFD700] bg-[#FFD700]/10"
                            : "border-border-card bg-tertiary-bg"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                          {/* From user */}
                          <div className="flex items-center gap-2">
                            <TradeAvatarImage userId={fromId} />
                            <a
                              href={`https://www.roblox.com/users/${fromId}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="text-link hover:text-link-hover flex items-center gap-1 font-medium transition-colors">
                                {getUsername(fromId)}
                                {getHasVerifiedBadge(fromId) && (
                                  <VerifiedBadgeIcon className="h-3.5 w-3.5" />
                                )}
                              </div>
                            </a>
                          </div>

                          {/* Arrow + trade number */}
                          <div className="text-secondary-text flex items-center gap-1 sm:px-1">
                            <svg
                              className="h-4 w-4 shrink-0 sm:hidden"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 13l-5 5m0 0l-5-5m5 5V6"
                              />
                            </svg>
                            <svg
                              className="hidden h-4 w-4 shrink-0 sm:block"
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
                            <span className="text-xs whitespace-nowrap">
                              Trade #{trade.tradeNumber}
                            </span>
                          </div>

                          {/* To user */}
                          <div className="flex items-center gap-2">
                            <TradeAvatarImage userId={toId} />
                            <a
                              href={`https://www.roblox.com/users/${toId}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="text-link hover:text-link-hover flex items-center gap-1 font-medium transition-colors">
                                {getUsername(toId)}
                                {getHasVerifiedBadge(toId) && (
                                  <VerifiedBadgeIcon className="h-3.5 w-3.5" />
                                )}
                              </div>
                            </a>
                          </div>
                        </div>

                        <div className="text-secondary-text w-full text-center text-xs sm:w-auto sm:shrink-0 sm:text-right sm:text-sm">
                          {new Date(
                            trade.toUser.TradeTime * 1000,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Capped at 49+: gold first-known-owner card + dotted divider + chain trades
            const firstOwner = owners[0];
            const firstOwnerId = firstOwner.UserId.toString();

            const cappedChainTrades = [];
            for (let i = 1; i < owners.length - 1; i++) {
              cappedChainTrades.push({
                fromUser: owners[i],
                toUser: owners[i + 1],
              });
            }

            return (
              <div className="space-y-2">
                {/* First known owner — gold OG card */}
                <div className="flex flex-col gap-3 rounded-lg border border-[#FFD700] bg-[#FFD700]/10 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="shrink-0">
                      <TradeAvatarImage userId={firstOwnerId} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={`https://www.roblox.com/users/${firstOwnerId}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-link hover:text-link-hover font-medium transition-colors">
                            {getUsername(firstOwnerId)}
                          </span>
                          {getHasVerifiedBadge(firstOwnerId) && (
                            <VerifiedBadgeIcon className="h-4 w-4" />
                          )}
                          <span className="text-secondary-text text-xs font-normal">
                            Original owner
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className="text-secondary-text text-xs sm:shrink-0 sm:text-right sm:text-sm">
                    {new Date(firstOwner.TradeTime * 1000).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                </div>

                {/* Dotted divider — earlier trades may be missing */}
                <div className="relative py-4">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="border-tertiary-text/60 w-full border-t-2 border-dashed" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-secondary-bg border-border-card text-secondary-text rounded-full border px-3 text-xs font-medium">
                      Earlier trades may be missing — history capped at 49
                    </span>
                  </div>
                </div>

                {/* Chain trades */}
                {cappedChainTrades.map((trade) => {
                  const fromId = trade.fromUser.UserId.toString();
                  const toId = trade.toUser.UserId.toString();
                  return (
                    <div
                      key={`${fromId}-${toId}-${trade.toUser.TradeTime}`}
                      className="border-border-card bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                        <div className="flex items-center gap-2">
                          <TradeAvatarImage userId={fromId} />
                          <a
                            href={`https://www.roblox.com/users/${fromId}/profile`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="text-link hover:text-link-hover flex items-center gap-1 font-medium transition-colors">
                              {getUsername(fromId)}
                              {getHasVerifiedBadge(fromId) && (
                                <VerifiedBadgeIcon className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </a>
                        </div>

                        <div className="text-secondary-text flex items-center sm:px-1">
                          <svg
                            className="h-4 w-4 shrink-0 sm:hidden"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 13l-5 5m0 0l-5-5m5 5V6"
                            />
                          </svg>
                          <svg
                            className="hidden h-4 w-4 shrink-0 sm:block"
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
                        </div>

                        <div className="flex items-center gap-2">
                          <TradeAvatarImage userId={toId} />
                          <a
                            href={`https://www.roblox.com/users/${toId}/profile`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="text-link hover:text-link-hover flex items-center gap-1 font-medium transition-colors">
                              {getUsername(toId)}
                              {getHasVerifiedBadge(toId) && (
                                <VerifiedBadgeIcon className="h-3.5 w-3.5" />
                              )}
                            </div>
                          </a>
                        </div>
                      </div>

                      <div className="text-secondary-text w-full text-center text-xs sm:w-auto sm:shrink-0 sm:text-right sm:text-sm">
                        {new Date(
                          trade.toUser.TradeTime * 1000,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <DialogFooter className="mt-4 gap-2 px-6 pt-2 pb-6">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
