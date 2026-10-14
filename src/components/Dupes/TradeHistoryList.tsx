"use client";

import { getUserAvatar } from "@/utils/ui/images";
import { useMemo, useState } from "react";
import Image from "next/image";
import { SilhouetteAvatar } from "@/utils/ui/avatar";
import { DupeFinderHistoryEntry } from "@/types";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { formatShortDateTime } from "@/utils/helpers/timestamp";

import { RobloxUser } from "@/types";
import { useBatchUserData } from "@/hooks/useBatchUserData";

interface TradeHistoryListProps {
  history: DupeFinderHistoryEntry[];
  splitIndex?: number;
  usersData?: Record<string, RobloxUser>;
  showOriginalOwner?: boolean;
  showRecordNotes?: boolean;
  startIndex?: number;
  endIndex?: number;
  cardBg?: string;
}

type ResolvedUsers = Record<
  string,
  { name: string; displayName: string; hasVerifiedBadge: boolean }
>;

function ChainCard({
  fromUser,
  toUser,
  users,
  isFirst = false,
  cardBg = "bg-secondary-bg",
}: {
  fromUser: DupeFinderHistoryEntry;
  toUser: DupeFinderHistoryEntry;
  users: ResolvedUsers;
  isFirst?: boolean;
  cardBg?: string;
}) {
  const fromId = fromUser.UserId.toString();
  const toId = toUser.UserId.toString();
  const getDisplayName = (userId: string) =>
    users[userId]?.displayName ?? userId;
  const getUsername = (userId: string) => users[userId]?.name ?? userId;
  const getHasVerifiedBadge = (userId: string) =>
    users[userId]?.hasVerifiedBadge ?? false;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center ${
        isFirst
          ? "border-[#FFD700] bg-[#FFD700]/10"
          : `border-border-card ${cardBg}`
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
        <div className="text-xs">Traded on</div>
        {formatShortDateTime(toUser.TradeTime)}
      </div>
    </div>
  );
}

export function TradeHistoryAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string;
  name: string;
}) {
  const [avatarError, setAvatarError] = useState(false);
  if (avatarError) return <SilhouetteAvatar />;
  return (
    <Image
      src={avatarUrl}
      alt={name}
      width={40}
      height={40}
      className="rounded-full"
      onError={() => setAvatarError(true)}
    />
  );
}

export function OriginalOwnerCard({
  entry,
  user,
}: {
  entry: DupeFinderHistoryEntry;
  user?: { name?: string; displayName?: string; hasVerifiedBadge?: boolean };
}) {
  const id = entry.UserId.toString();
  const username = user?.name || id;
  const displayName = user?.displayName || username;
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#FFD700] bg-[#FFD700]/10 p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="border-border-card bg-tertiary-bg relative h-10 w-10 shrink-0 overflow-hidden rounded-full border">
          <TradeHistoryAvatar
            avatarUrl={getUserAvatar(id)}
            name={displayName}
          />
        </div>
        <div className="min-w-0 flex-1">
          <a
            href={`https://www.roblox.com/users/${id}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-link hover:text-link-hover font-medium transition-colors">
                {displayName}
              </span>
              {user?.hasVerifiedBadge && (
                <VerifiedBadgeIcon className="h-4 w-4" />
              )}
              <span className="text-secondary-text text-xs font-normal">
                Original owner
              </span>
            </div>
            <div className="text-secondary-text text-sm">@{username}</div>
          </a>
        </div>
      </div>
      <div className="text-secondary-text text-xs sm:shrink-0 sm:text-right sm:text-sm">
        <div className="text-xs">Original owner since</div>
        {formatShortDateTime(entry.TradeTime)}
      </div>
    </div>
  );
}

function HistoryDivergeSeparator() {
  return (
    <div
      role="separator"
      aria-label="Split starts here"
      className="flex items-center gap-2 py-2"
    >
      <span className="bg-status-error h-px flex-1" />
      <span className="text-status-error min-w-max text-xs font-semibold">
        Split starts here
      </span>
      <span className="bg-status-error h-px flex-1" />
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
          Earlier trades may be missing — only the latest 49 trades are retained
        </span>
      </div>
    </div>
  );
}

export default function TradeHistoryList({
  history,
  splitIndex,
  usersData,
  showOriginalOwner = true,
  showRecordNotes = true,
  startIndex = 0,
  endIndex,
  cardBg,
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

  const { robloxUsers } = useBatchUserData(tradeHistoryUserIds, {
    enabled: !usersData && tradeHistoryUserIds.length > 0,
  });
  const fetchedUsers = useMemo(() => {
    const processed: ResolvedUsers = {};
    Object.values(robloxUsers).forEach((user) => {
      if (!user?.id) return;
      const id = String(user.id);
      processed[id] = {
        name: user.name || id,
        displayName: user.displayName || user.name || id,
        hasVerifiedBadge: Boolean(user.hasVerifiedBadge),
      };
    });
    return processed;
  }, [robloxUsers]);

  const finalUsers = usersData ? memoizedUserData : fetchedUsers;

  if (!history || history.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary-text">
          No trade history is available for this item.
        </p>
      </div>
    );
  }

  const owners = history;
  const isCapped = owners.length >= 50;

  const start = Math.max(startIndex, isCapped ? 1 : 0);
  const firstOwner = owners[0];
  const firstOwnerId = firstOwner.UserId.toString();

  return (
    <div className="space-y-2">
      {showOriginalOwner && (
        <OriginalOwnerCard entry={firstOwner} user={finalUsers[firstOwnerId]} />
      )}

      {showRecordNotes && isCapped && <CappedDivider />}
      {showRecordNotes && !isCapped && owners.length > 1 && (
        <p className="text-secondary-text text-sm">
          First recorded trade: {formatShortDateTime(owners[1].TradeTime)}. No
          earlier trades are recorded.
        </p>
      )}
      <div className="space-y-2" role="region" aria-label="Recorded trades">
        {owners.length === 1 && (
          <p className="text-secondary-text py-4 text-sm">
            No trades are recorded for this item.
          </p>
        )}

        {owners.slice(start, endIndex ?? -1).map((owner, idx) => {
          const i = idx + start;
          const showSeparator =
            splitIndex !== undefined && i === splitIndex - 1;
          return (
            <div key={`${owner.UserId}-${owners[i + 1].UserId}-${i}`}>
              {showSeparator && <HistoryDivergeSeparator />}
              <ChainCard
                fromUser={owner}
                toUser={owners[i + 1]}
                users={finalUsers}
                cardBg={cardBg}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
