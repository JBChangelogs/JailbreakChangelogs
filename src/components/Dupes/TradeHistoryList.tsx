"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { DupeFinderHistoryEntry } from "@/types";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";

interface UserData {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
}
import { RobloxUser } from "@/types";

interface TradeHistoryListProps {
  history: DupeFinderHistoryEntry[];
  splitIndex?: number;
  usersData?: Record<string, RobloxUser>;
}

export default function TradeHistoryList({
  history,
  splitIndex,
  usersData,
}: TradeHistoryListProps) {
  const tradeHistoryUserIds = useMemo(() => {
    if (!history || !Array.isArray(history)) {
      return [];
    }

    const userIds = new Set<string>();
    history.forEach((entry) => {
      userIds.add(entry.UserId.toString());
    });

    return Array.from(userIds);
  }, [history]);

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

        setFetchedUsers(processedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, [tradeHistoryUserIds, usersData]);

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

  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary-text">
          This item has no ownership history.
        </p>
      </div>
    );
  }

  const owners = history;

  return (
    <div className="space-y-4">
      {owners.map((owner, index) => {
        const userId = owner.UserId.toString();
        // Index 0 is Oldest. (Based on API data provided)
        // splitIndex identifies the first item that differs.
        // So items < splitIndex are shared. Items >= splitIndex are unique.
        // We render a separator before the item at splitIndex.

        return (
          <div key={`${userId}-${owner.TradeTime}-${index}`}>
            {splitIndex !== undefined && index === splitIndex && (
              <div className="relative py-8">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="border-tertiary-text/60 w-full border-t-2 border-dashed"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-primary-bg text-secondary-text border-border-card rounded-full border px-3 text-xs font-medium">
                    History Diverges Here
                  </span>
                </div>
              </div>
            )}
            <div className="border-border-card bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
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
                          const defaultAvatar = document.createElement("div");
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
              <div className="text-primary-text px-2 py-1 text-xs sm:shrink-0 sm:text-right sm:text-sm">
                {new Date(owner.TradeTime * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
