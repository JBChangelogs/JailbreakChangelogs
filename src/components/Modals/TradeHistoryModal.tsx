"use client";

import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { getCategoryColor } from "@/utils/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
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

  const [tradeHistoryUsers, setTradeHistoryUsers] = useState<
    Record<
      string,
      { name: string; displayName: string; hasVerifiedBadge: boolean }
    >
  >({});

  useEffect(() => {
    if (!isOpen || tradeHistoryUserIds.length === 0) {
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users?userIds=${tradeHistoryUserIds.join(",")}`,
          {
            headers: {
              "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
              "X-Source":
                process.env.NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER ?? "",
            },
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
            const typedUser = user as UserData;
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

        setTradeHistoryUsers(processedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [isOpen, tradeHistoryUserIds]);

  const getDisplayName = (userId: string) => {
    const cachedUser = tradeHistoryUsers[userId];
    if (cachedUser) {
      return cachedUser.displayName;
    }

    return userId;
  };

  const getUsername = (userId: string) => {
    const cachedUser = tradeHistoryUsers[userId];
    if (cachedUser) {
      return cachedUser.name;
    }

    return userId;
  };

  const getHasVerifiedBadge = (userId: string) => {
    const cachedUser = tradeHistoryUsers[userId];
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
        <div className="border-border-primary bg-secondary-bg mx-auto max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border">
          <div className="border-border-primary border-b p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 sm:items-center">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-primary-text text-lg font-semibold sm:text-xl">
                  {item.title}&apos;s Ownership History
                </DialogTitle>
                {item.categoryTitle && (
                  <span
                    className="text-primary-text mt-2 flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium"
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
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-primary-text cursor-pointer rounded-full p-1 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6">
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
                        className="border-border-primary bg-primary-bg flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className="relative h-10 w-10 rounded-full bg-tertiary-bg overflow-hidden">
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
                        <div className="text-tertiary-text text-xs sm:text-sm sm:text-right sm:flex-shrink-0">
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
