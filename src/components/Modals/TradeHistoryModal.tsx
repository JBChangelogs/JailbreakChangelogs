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
import { formatShortDateTime } from "@/utils/helpers/timestamp";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { INVENTORY_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface ItemTransferHop {
  from_user_id: string | null;
  to_user_id: string | null;
  trade_time: number;
  confidence: "confirmed" | "gap";
}

interface ItemTransferBranch {
  branch_id: string;
  is_duplicate: boolean;
  hops: ItemTransferHop[];
}

interface ItemTransferHistory {
  item_id: string;
  branches: ItemTransferBranch[];
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

function TransferUser({
  userId,
  getUsername,
  getHasVerifiedBadge,
}: {
  userId: string | null;
  getUsername: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
}) {
  if (!userId || !/^\d+$/.test(userId)) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className="bg-quaternary-bg h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <DefaultAvatar name="Unknown owner" />
        </div>
        <span className="text-secondary-text font-medium">Unknown owner</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <TradeAvatarImage userId={userId} />
      <a
        href={`https://www.roblox.com/users/${userId}/profile`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link hover:text-link-hover flex min-w-0 items-center gap-1 font-medium transition-colors"
      >
        <span className="truncate">{getUsername(userId)}</span>
        {getHasVerifiedBadge(userId) && (
          <VerifiedBadgeIcon className="h-3.5 w-3.5 shrink-0" />
        )}
      </a>
    </div>
  );
}

function TransferHistoryView({
  history,
  getUsername,
  getHasVerifiedBadge,
}: {
  history: ItemTransferHistory;
  getUsername: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
}) {
  const branches = [...history.branches].sort((left, right) => {
    if (left.is_duplicate === right.is_duplicate) return 0;
    return left.is_duplicate ? 1 : -1;
  });
  let duplicateNumber = 0;

  return (
    <div className="space-y-4">
      {branches.map((branch) => {
        const branchNumber = branch.is_duplicate ? ++duplicateNumber : 0;
        const hops = [...branch.hops].sort(
          (left, right) => left.trade_time - right.trade_time,
        );

        return (
          <section key={branch.branch_id} className="space-y-2">
            {branches.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-primary-text text-sm font-semibold">
                    {branch.is_duplicate
                      ? `Duped copy ${branchNumber}`
                      : "Original copy"}
                  </h3>
                  {branch.is_duplicate && (
                    <span className="border-status-warning/30 bg-status-warning/15 text-status-warning inline-flex h-6 items-center rounded-lg border px-2.5 text-xs leading-none font-semibold">
                      Duped copy
                    </span>
                  )}
                </div>
                <span className="text-secondary-text text-xs">
                  {hops.length} recorded{" "}
                  {hops.length === 1 ? "trade" : "trades"}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {hops.map((hop, index) => {
                const isFirstPrimaryTrade = !branch.is_duplicate && index === 0;

                return (
                  <div
                    key={`${branch.branch_id}-${hop.trade_time}-${hop.from_user_id}-${hop.to_user_id}-${index}`}
                    className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center ${
                      isFirstPrimaryTrade
                        ? "border-[#FFD700] bg-[#FFD700]/10"
                        : "border-border-card bg-tertiary-bg"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
                      <TransferUser
                        userId={hop.from_user_id}
                        getUsername={getUsername}
                        getHasVerifiedBadge={getHasVerifiedBadge}
                      />

                      <div className="text-secondary-text flex items-center gap-1.5 sm:px-1">
                        <svg
                          className="h-4 w-4 shrink-0 sm:hidden"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
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
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        <span className="text-xs whitespace-nowrap">
                          Trade #{index + 1}
                        </span>
                      </div>

                      <TransferUser
                        userId={hop.to_user_id}
                        getUsername={getUsername}
                        getHasVerifiedBadge={getHasVerifiedBadge}
                      />
                    </div>

                    <div className="text-secondary-text flex w-full items-center justify-center gap-2 text-xs sm:w-auto sm:shrink-0 sm:justify-end sm:text-sm">
                      <time
                        dateTime={new Date(hop.trade_time * 1000).toISOString()}
                      >
                        {formatShortDateTime(hop.trade_time)}
                      </time>
                      {hop.confidence !== "confirmed" && (
                        <>
                          <span aria-hidden="true">·</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="text-tertiary-text decoration-tertiary-text/70 cursor-help border-b border-dotted text-xs font-medium"
                                tabIndex={0}
                              >
                                Recovered record
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-64">
                              This transfer was recovered after a tracking gap.
                              It is not an error.
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function TradeHistoryModal({
  isOpen,
  onClose,
  item,
  username,
  isDupeTab = false,
  usersData,
}: TradeHistoryModalProps) {
  const pathname = usePathname();
  const [instanceHistory, setInstanceHistory] =
    useState<ItemTransferHistory | null>(null);
  const [instanceHistoryState, setInstanceHistoryState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [instanceHistoryError, setInstanceHistoryError] = useState<
    string | null
  >(null);
  const [instanceHistoryRetry, setInstanceHistoryRetry] = useState(0);

  useEffect(() => {
    if (!isOpen || !item?.id || !INVENTORY_API_URL) return;

    const controller = new AbortController();
    let ignore = false;
    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 15_000);

    setInstanceHistory(null);
    setInstanceHistoryError(null);
    setInstanceHistoryState("loading");

    const fetchInstanceHistory = async () => {
      try {
        const { url, headers } = buildApiFetchRequest(
          INVENTORY_API_URL,
          `/trades/instance/${encodeURIComponent(item.id!)}?nocache=false`,
        );
        const response = await fetch(url, {
          headers,
          signal: controller.signal,
          cache: "no-store",
        });

        if (ignore) return;
        if (response.status === 404) {
          setInstanceHistory({ item_id: item.id!, branches: [] });
          setInstanceHistoryState("success");
          return;
        }
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const message =
            typeof body === "string"
              ? body
              : body && typeof body === "object" && "message" in body
                ? String(body.message)
                : `Failed to load item transfer history (${response.status})`;
          throw new Error(message);
        }

        const history = (await response.json()) as ItemTransferHistory;
        if (!history || !Array.isArray(history.branches)) {
          throw new Error("Invalid item transfer history response");
        }
        if (ignore) return;
        setInstanceHistory(history);
        setInstanceHistoryState("success");
      } catch (error) {
        if (ignore || (controller.signal.aborted && !didTimeout)) return;
        log.error("fetch item transfer history failed", {
          itemId: item.id,
          error,
        });
        setInstanceHistoryError(
          didTimeout
            ? "The transfer history request timed out."
            : error instanceof Error
              ? error.message
              : "Failed to load item transfer history",
        );
        setInstanceHistoryState("error");
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void fetchInstanceHistory();

    return () => {
      ignore = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [instanceHistoryRetry, isOpen, item?.id]);

  const tradeHistoryUserIds = useMemo(() => {
    const userIds = new Set<string>();
    if (instanceHistory && instanceHistory.branches.length > 0) {
      instanceHistory.branches.forEach((branch) => {
        branch.hops.forEach((hop) => {
          if (hop.from_user_id && /^\d+$/.test(hop.from_user_id)) {
            userIds.add(hop.from_user_id);
          }
          if (hop.to_user_id && /^\d+$/.test(hop.to_user_id)) {
            userIds.add(hop.to_user_id);
          }
        });
      });
    } else if (item?.history && Array.isArray(item.history)) {
      item.history.forEach((entry) => {
        userIds.add(entry.UserId.toString());
      });
    }

    return Array.from(userIds);
  }, [instanceHistory, item]);

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

  const finalUsers = useMemo(
    () => ({ ...fetchedUsers, ...memoizedUserData }),
    [fetchedUsers, memoizedUserData],
  );

  useEffect(() => {
    if (!isOpen) return;

    const missingUserIds = tradeHistoryUserIds.filter(
      (userId) => !memoizedUserData[userId],
    );
    if (missingUserIds.length === 0) {
      return;
    }

    let ignore = false;

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
            body: JSON.stringify({ userIds: missingUserIds }),
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
        if (ignore) return;
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
        if (ignore) return;
        log.error("Failed to fetch users", error);
      }
    };

    fetchUsers();

    return () => {
      ignore = true;
    };
  }, [isOpen, memoizedUserData, tradeHistoryUserIds]);

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
            if (instanceHistoryState === "loading") {
              return (
                <div className="text-secondary-text flex min-h-48 items-center justify-center gap-2 text-sm">
                  <Spinner className="h-5 w-5" /> Loading transfer history...
                </div>
              );
            }

            if (instanceHistory && instanceHistory.branches.length > 0) {
              return (
                <TransferHistoryView
                  history={instanceHistory}
                  getUsername={getUsername}
                  getHasVerifiedBadge={getHasVerifiedBadge}
                />
              );
            }

            const hasLegacyHistory = Boolean(
              item.history &&
              Array.isArray(item.history) &&
              item.history.length > 0,
            );
            if (instanceHistoryState === "error" && !hasLegacyHistory) {
              return (
                <div className="py-8 text-center">
                  <p className="text-primary-text font-semibold">
                    Couldn&apos;t load transfer history
                  </p>
                  <p className="text-secondary-text mt-1 text-sm">
                    {instanceHistoryError}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() =>
                      setInstanceHistoryRetry((current) => current + 1)
                    }
                  >
                    Try again
                  </Button>
                </div>
              );
            }

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
                          {formatShortDateTime(trade.toUser.TradeTime)}
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
                    {formatShortDateTime(firstOwner.TradeTime)}
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
                        {formatShortDateTime(trade.toUser.TradeTime)}
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
