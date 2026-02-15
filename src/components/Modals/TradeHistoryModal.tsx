"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogTitle } from "@headlessui/react";
import { Icon } from "@/components/ui/IconWrapper";
import Image from "next/image";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { RobloxUser } from "@/types";
import { Button } from "@/components/ui/button";

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
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [isOpen, tradeHistoryUserIds, usersData]);

  const getDisplayName = (userId: string) => {
    const cachedUser = finalUsers[userId];
    if (cachedUser) {
      return cachedUser.displayName;
    }

    return userId;
  };

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

  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="border-border-card bg-secondary-bg mx-auto flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border">
          <div className="border-border-card border-b p-4 sm:p-6">
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
                      className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                      style={{
                        borderColor: getCategoryColor(item.categoryTitle),
                      }}
                    >
                      {(() => {
                        const categoryIcon = getCategoryIcon(
                          item.categoryTitle,
                        );
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

              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded-full p-1 transition-colors"
                aria-label="Close modal"
              >
                <Icon icon="heroicons:x-mark" className="h-6 w-6" />
              </button>
            </div>

            {item.id && (pathname?.startsWith("/dupes") || isDupeTab) && (
              <div className="bg-button-info/10 border-border-card mx-4 mt-2 mb-0 flex flex-col items-center justify-between gap-4 rounded-lg border p-3 sm:mx-6 sm:flex-row">
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
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-6">
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

              return (
                <div className="space-y-2">
                  {owners.map((owner, index) => {
                    const userId = owner.UserId.toString();

                    return (
                      <div
                        key={`${userId}-${owner.TradeTime}-${index}`}
                        className="border-border-card bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="shrink-0">
                            <div className="bg-tertiary-bg relative h-10 w-10 overflow-hidden rounded-full">
                              <Image
                                src={getUserAvatar(userId)}
                                alt="User Avatar"
                                width={40}
                                height={40}
                                className="rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector("svg")) {
                                    const defaultAvatar =
                                      document.createElement("div");
                                    defaultAvatar.className =
                                      "flex h-full w-full items-center justify-center";
                                    defaultAvatar.innerHTML = `<svg class="h-6 w-6 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
                                    parent.appendChild(defaultAvatar);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <a
                              href={`https://www.roblox.com/users/${userId}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="text-link hover:text-link-hover flex items-center gap-1.5 font-medium transition-colors">
                                {getDisplayName(userId)}
                                {getHasVerifiedBadge(userId) && (
                                  <VerifiedBadgeIcon className="h-4 w-4" />
                                )}
                              </div>
                              <div className="text-secondary-text text-sm">
                                @{getUsername(userId)}
                              </div>
                            </a>
                          </div>
                        </div>
                        <div className="text-secondary-text text-xs sm:shrink-0 sm:text-right sm:text-sm">
                          {new Date(owner.TradeTime * 1000).toLocaleDateString(
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
