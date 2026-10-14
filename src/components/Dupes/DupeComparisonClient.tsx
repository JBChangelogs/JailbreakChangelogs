"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DupeFinderItem, Item, RobloxUser } from "@/types";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import ReportFalseDupeModal from "@/components/Dupes/ReportFalseDupeModal";
import { Icon } from "@/components/ui/IconWrapper";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getCategoryColor, getCategoryIcon } from "@/utils/items/categoryIcons";
import {
  formatMonthDayYear,
  formatProfileDate,
} from "@/utils/helpers/timestamp";
import TradeHistoryList, {
  OriginalOwnerCard,
  TradeHistoryAvatar,
} from "./TradeHistoryList";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/ui/images";

interface DupeComparisonClientProps {
  ogItem: DupeFinderItem;
  duplicateItem: DupeFinderItem;
  itemsData: Item[];
}

interface VariantColumnProps {
  item: DupeFinderItem;
  splitIndex?: number;
  startIndex?: number;
  robloxUsers: Record<string, { name?: string; displayName?: string }>;
  usersData: Record<string, RobloxUser>;
  showOriginalOwner: boolean;
}

// Index of the first transfer card TradeHistoryList renders. Capped histories
// lose the sender of their oldest kept trade, so the list skips that card.
const firstCard = (item: DupeFinderItem, from = 0) =>
  Math.max(from, (item.history?.length ?? 0) >= 50 ? 1 : 0);

const shownTrades = (item: DupeFinderItem, from = 0) =>
  (item.history ?? []).slice(firstCard(item, from) + 1);

function VariantColumn({
  item,
  splitIndex,
  startIndex,
  robloxUsers,
  usersData,
  showOriginalOwner,
}: VariantColumnProps) {
  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  const getUsername = (userId: string) => {
    return robloxUsers[userId]?.name || userId;
  };

  const getUserDisplay = (userId: string) => {
    return (
      robloxUsers[userId]?.displayName || robloxUsers[userId]?.name || userId
    );
  };

  const trades = shownTrades(item, startIndex);

  return (
    <div className="space-y-4">
      <div className="bg-secondary-bg border-border-card flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Owner Info */}
        <div className="min-w-0 space-y-1">
          <div className="text-secondary-text text-xs font-bold tracking-wider uppercase">
            Last recorded owner
          </div>
          <Link
            href={item.user_id ? `/inventories/${item.user_id}` : "#"}
            prefetch={false}
            className="group flex min-w-0 items-center gap-2"
          >
            <div className="bg-tertiary-bg border-border-card relative h-10 w-10 shrink-0 overflow-hidden rounded-full border transition-colors">
              <TradeHistoryAvatar
                avatarUrl={getUserAvatar(item.user_id || "")}
                name={getUserDisplay(item.user_id || "")}
              />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-link group-hover:text-link-hover truncate font-bold transition-colors">
                {getUserDisplay(item.user_id || "")}
              </div>
              <div className="text-secondary-text truncate text-xs">
                @{getUsername(item.user_id || "")}
              </div>
            </div>
          </Link>
        </div>

        {/* Logged Date */}
        <div className="border-border-card border-t pt-2 lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-3 lg:text-right">
          <div className="text-secondary-text mb-1 text-xs uppercase">
            Last recorded
          </div>
          <div className="text-primary-text text-sm font-medium">
            {formatProfileDate(item.logged_at)}
          </div>
        </div>
      </div>

      <div className="border-border-card mt-4 border-t pt-4">
        <h3 className="text-primary-text mb-3 text-lg font-bold">
          {startIndex === undefined ? "Trade history" : "After the split"}
          <span className="text-secondary-text block text-sm font-normal sm:ml-2 sm:inline">
            {trades.length} {trades.length === 1 ? "trade" : "trades"}
            {trades.length > 0 &&
              ` · ${formatMonthDayYear(trades[0].TradeTime)} → ${formatMonthDayYear(trades[trades.length - 1].TradeTime)}`}
          </span>
        </h3>
        <TradeHistoryList
          history={item.history || []}
          splitIndex={splitIndex}
          startIndex={startIndex}
          usersData={usersData}
          showOriginalOwner={showOriginalOwner}
          showRecordNotes={false}
        />
      </div>
    </div>
  );
}

export default function DupeComparisonClient({
  ogItem,
  duplicateItem,
  itemsData,
}: DupeComparisonClientProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportState, setReportState] = useState<
    "submitted" | "already_reported" | null
  >(null);
  const { isAuthenticated, setLoginModal } = useAuthContext();

  const openReportModal = () => {
    if (!isAuthenticated) {
      toast.info("You must be logged in to report a false dupe.");
      setLoginModal({ open: true });
      return;
    }
    setReportModalOpen(true);
  };

  // Get Original Owner ID from OG item info
  const originalOwnerId =
    ogItem.info?.find((i) => i.title === "Original Owner")?.value ||
    ogItem.user_id;
  const normalizedOriginalOwnerId = originalOwnerId
    ? String(originalOwnerId)
    : null;

  // Collect user IDs to fetch
  const userIds = [
    ogItem.user_id,
    duplicateItem.user_id,
    originalOwnerId,
    ...(ogItem.history?.map((h) => h.UserId.toString()) || []),
    ...(duplicateItem.history?.map((h) => h.UserId.toString()) || []),
  ].filter(Boolean) as string[];

  const { robloxUsers } = useBatchUserData(userIds);

  const sharedItemData = itemsData.find(
    (data) => data.id === duplicateItem.item_id,
  );

  // Calculate Split Point
  // Handles truncation issue: when histories exceed 50 entries, the oldest non-original
  // user gets removed, causing false divergences. This function uses timestamps to align
  // trades and find the last common trade, working backwards from the newest entries.
  const calculateSplitIndex = (
    history1: { UserId: number; TradeTime: number }[],
    history2: { UserId: number; TradeTime: number }[],
  ) => {
    if (
      !history1 ||
      !history2 ||
      history1.length === 0 ||
      history2.length === 0
    ) {
      return -1;
    }

    if (history1[0].UserId !== history2[0].UserId) {
      return 0;
    }

    const timeToIndex2 = new Map<number, number>();

    history2.forEach((entry, idx) => {
      timeToIndex2.set(entry.TradeTime, idx);
    });

    let lastCommonIndex = -1;

    for (let i = history1.length - 1; i >= 0; i--) {
      const entry1 = history1[i];
      const idx2 = timeToIndex2.get(entry1.TradeTime);

      if (idx2 !== undefined && history2[idx2].UserId === entry1.UserId) {
        // A shared original owner alone cannot locate a split in capped histories.
        if (i === 0 && (history1.length >= 50 || history2.length >= 50)) {
          return -1;
        }
        lastCommonIndex = i + 1; // Split point is AFTER this trade
        break;
      }
    }

    return lastCommonIndex;
  };

  const selectedSplitIndex = calculateSplitIndex(
    duplicateItem.history || [],
    ogItem.history || [],
  );
  const variantSplitIndex = calculateSplitIndex(
    ogItem.history || [],
    duplicateItem.history || [],
  );

  const leftOrigin = duplicateItem.history?.[0];
  const rightOrigin = ogItem.history?.[0];
  const sharedOrigin =
    leftOrigin &&
    rightOrigin &&
    leftOrigin.UserId === rightOrigin.UserId &&
    leftOrigin.TradeTime === rightOrigin.TradeTime
      ? leftOrigin
      : undefined;
  const copyName = (item: DupeFinderItem) => {
    const user = robloxUsers[item.user_id || ""];
    return `${user?.displayName || user?.name || item.user_id || "Unknown"}'s copy`;
  };
  const cappedCopies = [duplicateItem, ogItem]
    .filter((item) => (item.history?.length ?? 0) >= 50)
    .map(copyName);
  const userName = (id?: number | string) => {
    const user = id === undefined ? undefined : robloxUsers[String(id)];
    return user?.displayName || user?.name || String(id);
  };
  const leftTrunk = selectedSplitIndex - 1 - firstCard(duplicateItem);
  const rightTrunk = variantSplitIndex - 1 - firstCard(ogItem);
  const trunk =
    leftTrunk >= rightTrunk
      ? { item: duplicateItem, split: selectedSplitIndex, cards: leftTrunk }
      : { item: ogItem, split: variantSplitIndex, cards: rightTrunk };
  const hasTrunk = trunk.cards > 0;
  const lastShared = trunk.item.history?.[trunk.split - 1];
  const sharedTrades = selectedSplitIndex - 1;
  const summary =
    hasTrunk && lastShared
      ? {
          title: `${trunk.cards} shared ${trunk.cards === 1 ? "trade" : "trades"}, then split at ${userName(lastShared.UserId)}`,
          detail: "",
        }
      : sharedTrades === 0
        ? {
            title: "The histories split right after the original owner",
            detail: "No later trades are shared between the two copies.",
          }
        : {
            title: "The recorded histories don't overlap",
            detail:
              cappedCopies.length > 0
                ? `Shared trades may be cut off: ${cappedCopies.join(" and ")} ${cappedCopies.length === 1 ? "only keeps" : "only keep"} the latest 49.`
                : "",
          };

  if (!sharedItemData) {
    return (
      <div className="py-8 text-center text-red-500">
        Error: Could not find item metadata for ID {duplicateItem.item_id}.
      </div>
    );
  }

  const categoryIcon = getCategoryIcon(duplicateItem.categoryTitle);

  return (
    <div className="space-y-8">
      {/* Back Button */}
      {originalOwnerId && (
        <div className="flex justify-start">
          <Link
            href={`/dupes/${originalOwnerId}`}
            className="border-border-card bg-secondary-bg text-primary-text hover:bg-tertiary-bg flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="h-5 w-5" />
            Back to Player Dupes
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div
            className="bg-secondary-bg border-border-card relative w-40 shrink-0 overflow-hidden rounded-lg border sm:w-56"
            style={{ aspectRatio: "854 / 480" }}
          >
            {!["Brakes"].includes(duplicateItem.categoryTitle) ? (
              isVideoItem(duplicateItem.title) ? (
                <video
                  src={getVideoPath(
                    duplicateItem.categoryTitle,
                    duplicateItem.title,
                  )}
                  className="h-full w-full object-cover"
                >
                  <track
                    kind="captions"
                    src="/captions/empty.vtt"
                    srcLang="en"
                    label="English"
                    default
                  />
                </video>
              ) : isDriftItem(duplicateItem.categoryTitle) ? (
                <div className="relative h-full w-full">
                  <Image
                    src={getItemImagePath(
                      duplicateItem.categoryTitle,
                      duplicateItem.title,
                      true,
                    )}
                    alt={duplicateItem.title}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                  <video
                    src={getDriftVideoPath(duplicateItem.title, true)}
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                    muted
                    loop
                    playsInline
                  />
                </div>
              ) : (
                <Image
                  src={getItemImagePath(
                    duplicateItem.categoryTitle,
                    duplicateItem.title,
                    true,
                  )}
                  alt={duplicateItem.title}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                />
              )
            ) : (
              <Image
                src={getItemImagePath(
                  duplicateItem.categoryTitle,
                  duplicateItem.title,
                  true,
                )}
                alt={duplicateItem.title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Link
              href={`/item/${encodeURIComponent(duplicateItem.categoryTitle)}/${encodeURIComponent(duplicateItem.title)}`}
              className="group mb-2 inline-flex transition-opacity"
            >
              <h2 className="text-primary-text group-hover:text-link-hover text-2xl font-bold wrap-anywhere transition-colors sm:text-3xl">
                {sharedItemData.name}
              </h2>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
                style={{
                  borderColor: getCategoryColor(duplicateItem.categoryTitle),
                  backgroundColor: `${getCategoryColor(duplicateItem.categoryTitle)}22`,
                }}
              >
                {categoryIcon && (
                  <categoryIcon.Icon
                    className="h-3 w-3"
                    style={{
                      color: getCategoryColor(duplicateItem.categoryTitle),
                    }}
                  />
                )}
                {duplicateItem.categoryTitle}
              </span>
            </div>
            {reportState ? (
              <div className="text-primary-text flex items-start gap-2 text-sm">
                <Icon
                  icon="mdi:check-circle-outline"
                  className="text-button-success mt-0.5 size-5 shrink-0"
                />
                <div>
                  <p className="font-semibold">
                    {reportState === "submitted"
                      ? "False dupe report received"
                      : "False dupe already reported"}
                  </p>
                  <p className="text-secondary-text mt-1">
                    This item is queued for review. You don&apos;t need to
                    submit another report.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={openReportModal}
              >
                Report False Dupe
              </Button>
            )}
          </div>
        </div>
        {sharedOrigin && (
          <OriginalOwnerCard
            entry={sharedOrigin}
            user={robloxUsers[sharedOrigin.UserId.toString()]}
          />
        )}
      </div>

      {hasTrunk ? (
        <details className="group bg-secondary-bg border-border-card rounded-lg border p-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <p className="text-primary-text text-lg font-semibold">
              {summary.title}
            </p>
            <span className="border-border-card text-primary-text group-hover:bg-tertiary-bg flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors">
              <span>
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span> the{" "}
                {trunk.cards} shared {trunk.cards === 1 ? "trade" : "trades"}
              </span>
              <Icon
                icon="heroicons:chevron-down"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </span>
          </summary>
          <div className="mt-4">
            <TradeHistoryList
              history={trunk.item.history || []}
              endIndex={trunk.split - 1}
              nested
              usersData={robloxUsers}
              showOriginalOwner={false}
              showRecordNotes={false}
            />
          </div>
        </details>
      ) : (
        <div className="bg-secondary-bg border-border-card rounded-lg border p-4">
          <p className="text-primary-text text-lg font-semibold">
            {summary.title}
          </p>
          {summary.detail && (
            <p className="text-secondary-text mt-1 text-sm">{summary.detail}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <VariantColumn
          item={duplicateItem}
          splitIndex={selectedSplitIndex}
          startIndex={hasTrunk ? selectedSplitIndex - 1 : undefined}
          robloxUsers={robloxUsers}
          usersData={robloxUsers}
          showOriginalOwner={!sharedOrigin}
        />
        <VariantColumn
          item={ogItem}
          splitIndex={variantSplitIndex}
          startIndex={hasTrunk ? variantSplitIndex - 1 : undefined}
          robloxUsers={robloxUsers}
          usersData={robloxUsers}
          showOriginalOwner={!sharedOrigin}
        />
      </div>

      <ReportFalseDupeModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        item={{
          id: duplicateItem.id,
          item_id: duplicateItem.item_id,
          title: duplicateItem.title,
          categoryTitle: duplicateItem.categoryTitle,
        }}
        originalOwner={
          normalizedOriginalOwnerId
            ? {
                id: normalizedOriginalOwnerId,
                displayName:
                  robloxUsers[normalizedOriginalOwnerId]?.displayName ||
                  robloxUsers[normalizedOriginalOwnerId]?.name ||
                  normalizedOriginalOwnerId,
              }
            : undefined
        }
        onReportResolved={setReportState}
      />
    </div>
  );
}
