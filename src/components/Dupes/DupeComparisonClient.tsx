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
import { formatProfileDate } from "@/utils/helpers/timestamp";
import TradeHistoryList from "./TradeHistoryList";
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
  title: string;
  item: DupeFinderItem;
  splitIndex: number;
  robloxUsers: Record<string, { name?: string; displayName?: string }>;
  usersData: Record<string, RobloxUser>;
}

function VariantColumn({
  title,
  item,
  splitIndex,
  robloxUsers,
  usersData,
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

  return (
    <div className="space-y-4">
      <h2 className="text-primary-text text-center text-xl font-bold">
        {title}
      </h2>

      <div className="bg-secondary-bg border-border-card flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Owner Info */}
        <div className="min-w-0 space-y-1">
          <div className="text-secondary-text text-xs font-bold tracking-wider uppercase">
            Current Owner
          </div>
          <Link
            href={item.user_id ? `/inventories/${item.user_id}` : "#"}
            prefetch={false}
            className="group flex min-w-0 items-center gap-2"
          >
            <div className="bg-tertiary-bg border-border-card relative h-10 w-10 shrink-0 overflow-hidden rounded-full border transition-colors">
              <Image
                src={getUserAvatar(item.user_id || "")}
                alt="Owner Avatar"
                width={40}
                height={40}
                className="rounded-full"
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
            Logged On
          </div>
          <div className="text-primary-text text-sm font-medium">
            {formatProfileDate(item.logged_at)}
          </div>
        </div>
      </div>

      <div className="border-border-card mt-4 border-t pt-4">
        <h3 className="text-primary-text mb-3 text-lg font-bold">
          Ownership History ({item.history?.length || 0})
        </h3>
        <div className="max-h-175 overflow-y-auto pr-1">
          <TradeHistoryList
            history={item.history || []}
            splitIndex={splitIndex}
            usersData={usersData}
          />
        </div>
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

    const timeToIndex1 = new Map<number, number>();
    const timeToIndex2 = new Map<number, number>();

    history1.forEach((entry, idx) => {
      timeToIndex1.set(entry.TradeTime, idx);
    });

    history2.forEach((entry, idx) => {
      timeToIndex2.set(entry.TradeTime, idx);
    });

    let lastCommonIndex = 0;

    for (let i = history1.length - 1; i >= 0; i--) {
      const entry1 = history1[i];
      const idx2 = timeToIndex2.get(entry1.TradeTime);

      if (idx2 !== undefined && history2[idx2].UserId === entry1.UserId) {
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

      {/* Shared Summary Header */}
      <div className="bg-secondary-bg border-border-card mx-auto max-w-7xl rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
          <div
            className="bg-secondary-bg border-border-card relative w-full shrink-0 overflow-hidden rounded-lg border md:w-80 lg:w-96"
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
          <div className="min-w-0 flex-1 space-y-4">
            <Link
              href={`/item/${encodeURIComponent(duplicateItem.categoryTitle)}/${encodeURIComponent(duplicateItem.title)}`}
              className="group mb-2 inline-flex transition-opacity"
            >
              <h2 className="text-primary-text group-hover:text-link-hover text-3xl font-bold wrap-anywhere transition-colors">
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
            <p className="text-secondary-text text-sm">
              Showing two copies. Item 1 may change as more duplicates are
              found.
            </p>
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
                className="w-full shrink-0 sm:w-auto"
                onClick={openReportModal}
              >
                Report False Dupe
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2">
        <VariantColumn
          title="Item 1"
          item={duplicateItem}
          splitIndex={selectedSplitIndex}
          robloxUsers={robloxUsers}
          usersData={robloxUsers}
        />
        <VariantColumn
          title="Item 2"
          item={ogItem}
          splitIndex={variantSplitIndex}
          robloxUsers={robloxUsers}
          usersData={robloxUsers}
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
