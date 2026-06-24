"use client";

import { createLogger } from "@/services/logger";
import { useMemo, useState, useEffect } from "react";

const log = createLogger("UI");
import Image from "next/image";
import { DefaultAvatar } from "@/utils/ui/avatar";
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

function TradeHistoryAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string;
  name: string;
}) {
  const [avatarError, setAvatarError] = useState(false);
  if (avatarError) return <DefaultAvatar name={name} />;
  return (
    <Image
      src={avatarUrl}
      alt="User Avatar"
      width={40}
      height={40}
      className="rounded-full"
      onError={() => setAvatarError(true)}
    />
  );
}

function HistoryDivergeSeparator() {
  return (
    <div className="relative py-8">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="border-tertiary-text/60 w-full border-t-2 border-dashed" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-primary-bg text-secondary-text border-border-card rounded-full border px-3 text-xs font-medium">
          History Diverges Here
        </span>
      </div>
    </div>
  );
}

function CappedDivider() {
  return (
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="border-tertiary-text/60 w-full border-t-2 border-dashed" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-secondary-bg border-border-card text-secondary-text rounded-full border px-3 text-xs font-medium">
          Earlier trades may be missing — history capped at 49
        </span>
      </div>
    </div>
  );
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

  const finalUsers = usersData ? memoizedUserData : fetchedUsers;

  useEffect(() => {
    if (usersData) return;
    if (tradeHistoryUserIds.length === 0) return;

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

        if (!response.ok) return;

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
        log.error("Failed to fetch users", error);
      }
    };

    fetchUsers();
  }, [tradeHistoryUserIds, usersData]);

  const getDisplayName = (userId: string) =>
    finalUsers[userId]?.displayName ?? userId;
  const getUsername = (userId: string) => finalUsers[userId]?.name ?? userId;
  const getHasVerifiedBadge = (userId: string) =>
    finalUsers[userId]?.hasVerifiedBadge ?? false;
  const getUserAvatar = (userId: string) =>
    `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;

  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary-text">
          This item has no ownership history.
        </p>
      </div>
    );
  }

  if (history.length === 1) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary-text">
          This item has no trade history yet — it has never been traded.
        </p>
      </div>
    );
  }

  const owners = history;
  const isCapped = owners.length >= 49;

  const ChainCard = ({
    fromUser,
    toUser,
    isFirst = false,
  }: {
    fromUser: DupeFinderHistoryEntry;
    toUser: DupeFinderHistoryEntry;
    isFirst?: boolean;
  }) => {
    const fromId = fromUser.UserId.toString();
    const toId = toUser.UserId.toString();
    return (
      <div
        className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center ${
          isFirst
            ? "border-[#FFD700] bg-[#FFD700]/10"
            : "border-border-card bg-tertiary-bg"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <div className="border-border-card bg-tertiary-bg relative h-10 w-10 shrink-0 overflow-hidden rounded-full border">
              <TradeHistoryAvatar
                avatarUrl={getUserAvatar(fromId)}
                name={getDisplayName(fromId)}
              />
            </div>
            <a
              href={`https://www.roblox.com/users/${fromId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="text-link hover:text-link-hover flex items-center gap-1 font-medium transition-colors">
                {getDisplayName(fromId)}
                {getHasVerifiedBadge(fromId) && (
                  <VerifiedBadgeIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="text-secondary-text text-xs">
                @{getUsername(fromId)}
              </div>
            </a>
          </div>

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
          </div>

          <div className="flex items-center gap-2">
            <div className="border-border-card bg-tertiary-bg relative h-10 w-10 shrink-0 overflow-hidden rounded-full border">
              <TradeHistoryAvatar
                avatarUrl={getUserAvatar(toId)}
                name={getDisplayName(toId)}
              />
            </div>
            <a
              href={`https://www.roblox.com/users/${toId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div className="text-link hover:text-link-hover flex items-center gap-1 font-medium transition-colors">
                {getDisplayName(toId)}
                {getHasVerifiedBadge(toId) && (
                  <VerifiedBadgeIcon className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="text-secondary-text text-xs">
                @{getUsername(toId)}
              </div>
            </a>
          </div>
        </div>

        <div className="text-secondary-text w-full text-center text-xs sm:w-auto sm:shrink-0 sm:text-right sm:text-sm">
          {new Date(toUser.TradeTime * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    );
  };

  if (!isCapped) {
    return (
      <div className="space-y-2">
        {owners.slice(0, -1).map((owner, i) => {
          const showSeparator =
            splitIndex !== undefined && i === splitIndex - 1;
          return (
            <div key={`${owner.UserId}-${owners[i + 1].UserId}-${i}`}>
              {showSeparator && <HistoryDivergeSeparator />}
              <ChainCard
                fromUser={owner}
                toUser={owners[i + 1]}
                isFirst={i === 0}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Capped view
  const firstOwner = owners[0];
  const firstOwnerId = firstOwner.UserId.toString();

  return (
    <div className="space-y-2">
      {/* First known owner — gold OG card */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#FFD700] bg-[#FFD700]/10 p-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="border-border-card bg-tertiary-bg relative h-10 w-10 shrink-0 overflow-hidden rounded-full border">
            <TradeHistoryAvatar
              avatarUrl={getUserAvatar(firstOwnerId)}
              name={getDisplayName(firstOwnerId)}
            />
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
                  {getDisplayName(firstOwnerId)}
                </span>
                {getHasVerifiedBadge(firstOwnerId) && (
                  <VerifiedBadgeIcon className="h-4 w-4" />
                )}
                <span className="text-secondary-text text-xs font-normal">
                  Original owner
                </span>
              </div>
              <div className="text-secondary-text text-sm">
                @{getUsername(firstOwnerId)}
              </div>
            </a>
          </div>
        </div>
        <div className="text-secondary-text text-xs sm:shrink-0 sm:text-right sm:text-sm">
          {new Date(firstOwner.TradeTime * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      <CappedDivider />

      {owners.slice(1, -1).map((owner, idx) => {
        const i = idx + 1;
        const showSeparator = splitIndex !== undefined && i === splitIndex - 1;
        return (
          <div key={`${owner.UserId}-${owners[i + 1].UserId}-${i}`}>
            {showSeparator && <HistoryDivergeSeparator />}
            <ChainCard fromUser={owner} toUser={owners[i + 1]} />
          </div>
        );
      })}
    </div>
  );
}
