"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DupeFinderItem, Item, RobloxUser } from "@/types";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import { Icon } from "@/components/ui/IconWrapper";
import {
  CategoryIconBadge,
  getCategoryColor,
  getCategoryIcon,
} from "@/utils/categoryIcons";
import { formatCustomDate } from "@/utils/timestamp";
import TradeHistoryList from "./TradeHistoryList";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";

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

      <div className="bg-secondary-bg border-border-card relative flex flex-col rounded-lg border p-4">
        {/* Owner Info */}
        <div className="my-4 flex flex-col items-center gap-2 text-center">
          <div className="text-secondary-text text-xs font-bold tracking-wider uppercase">
            Current Owner
          </div>
          <Link
            href={item.user_id ? `/inventories/${item.user_id}` : "#"}
            prefetch={false}
            className="group flex items-center gap-2"
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
            <div className="text-left">
              <div className="text-link group-hover:text-link-hover font-bold transition-colors">
                {getUserDisplay(item.user_id || "")}
              </div>
              <div className="text-secondary-text text-xs">
                @{getUsername(item.user_id || "")}
              </div>
            </div>
          </Link>
        </div>

        {/* Logged Date */}
        <div className="border-border-card mt-2 border-t pt-3 text-center">
          <div className="text-secondary-text mb-1 text-xs uppercase">
            Logged On
          </div>
          <div className="text-primary-text font-bold">
            {new Date(item.logged_at * 1000).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="border-border-card mt-4 border-t pt-4">
        <h3 className="text-primary-text mb-3 text-lg font-bold">
          Ownership History ({item.history?.length || 0})
        </h3>
        <div className="max-h-[700px] overflow-y-auto pr-1">
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
  const [selectedItem, setSelectedItem] = useState<DupeFinderItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Get Original Owner ID from OG item info
  const originalOwnerId =
    ogItem.info?.find((i) => i.title === "Original Owner")?.value ||
    ogItem.user_id;

  // Collect user IDs to fetch
  const userIds = [
    ogItem.user_id,
    duplicateItem.user_id,
    originalOwnerId,
    ...(ogItem.history?.map((h) => h.UserId.toString()) || []),
    ...(duplicateItem.history?.map((h) => h.UserId.toString()) || []),
  ].filter(Boolean) as string[];

  const { robloxUsers } = useBatchUserData(userIds);

  const getUsername = (userId: string) => {
    return robloxUsers[userId]?.name || userId;
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

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
      <div className="bg-secondary-bg border-border-card mx-auto max-w-4xl rounded-xl border p-6 text-center shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-6 md:flex-row md:items-stretch md:text-left">
          <div className="bg-secondary-bg border-border-card relative h-40 w-full shrink-0 overflow-hidden rounded-lg border md:h-auto md:w-64">
            <div className="absolute top-2 left-2 z-10">
              <CategoryIconBadge
                type={duplicateItem.categoryTitle}
                isLimited={sharedItemData.is_limited === 1}
                isSeasonal={sharedItemData.is_seasonal === 1}
                preferItemType={true}
                className="h-5 w-5"
              />
            </div>
            {!["Brakes"].includes(duplicateItem.categoryTitle) ? (
              isVideoItem(duplicateItem.title) ? (
                <video
                  src={getVideoPath(
                    duplicateItem.categoryTitle,
                    duplicateItem.title,
                  )}
                  className="h-full w-full object-cover"
                />
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
          <div className="flex-1">
            <Link
              href={`/item/${duplicateItem.categoryTitle}/${duplicateItem.title}`}
              className="group mb-3 inline-flex items-center justify-center gap-3 transition-opacity md:justify-start"
            >
              <h2 className="text-primary-text group-hover:text-link-hover text-3xl font-bold transition-colors">
                {sharedItemData.name}
              </h2>
            </Link>
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span
                className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                style={{
                  borderColor: getCategoryColor(duplicateItem.categoryTitle),
                }}
              >
                {(() => {
                  const categoryIcon = getCategoryIcon(
                    duplicateItem.categoryTitle,
                  );
                  return categoryIcon ? (
                    <categoryIcon.Icon
                      className="h-3 w-3"
                      style={{
                        color: getCategoryColor(duplicateItem.categoryTitle),
                      }}
                    />
                  ) : null;
                })()}
                {duplicateItem.categoryTitle}
              </span>
              {sharedItemData.is_limited === 1 && (
                <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                  <Icon icon="mdi:clock" className="h-3 w-3 text-[#ffd700]" />
                  Limited
                </span>
              )}
              {sharedItemData.is_seasonal === 1 && (
                <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl">
                  <Icon
                    icon="noto-v1:snowflake"
                    className="h-3 w-3 text-[#40c0e7]"
                  />
                  Seasonal
                </span>
              )}
            </div>
            {sharedItemData.metadata &&
              Object.keys(sharedItemData.metadata).length > 0 && (
                <div className="bg-tertiary-bg border-border-card mt-5 rounded-md border px-2 py-2">
                  <div className="text-primary-text text-xs font-semibold tracking-wide uppercase">
                    Official Trading Metrics
                  </div>
                  <div className="text-secondary-text text-xs">
                    by Badimo •{" "}
                    {sharedItemData.metadata.LastUpdated
                      ? `updated ${formatCustomDate(sharedItemData.metadata.LastUpdated)}`
                      : "unknown date"}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {typeof sharedItemData.metadata.TimesTraded ===
                      "number" && (
                      <div className="border-border-card bg-secondary-bg rounded-md border p-3">
                        <div className="text-secondary-text text-xs">
                          Times Traded
                        </div>
                        <div className="text-primary-text text-lg font-semibold">
                          {sharedItemData.metadata.TimesTraded.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {typeof sharedItemData.metadata.UniqueCirculation ===
                      "number" && (
                      <div className="border-border-card bg-secondary-bg rounded-md border p-3">
                        <div className="text-secondary-text text-xs">
                          Unique Circulation
                        </div>
                        <div className="text-primary-text text-lg font-semibold">
                          {sharedItemData.metadata.UniqueCirculation.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {typeof sharedItemData.metadata.DemandMultiple ===
                      "number" && (
                      <div className="border-border-card bg-secondary-bg rounded-md border p-3">
                        <div className="text-secondary-text text-xs">
                          Demand Multiple
                        </div>
                        <div className="text-primary-text text-lg font-semibold">
                          {sharedItemData.metadata.DemandMultiple.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
        <div className="bg-button-info/10 border-border-card text-secondary-text mx-auto flex max-w-2xl items-start gap-4 rounded-lg border p-4 text-sm shadow-sm">
          <div>
            <span className="text-primary-text font-bold">Note:</span> We only
            show 2 copies here. Item 1 can change over time as more duplicates
            are found.
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
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

      {showHistoryModal && selectedItem && (
        <TradeHistoryModal
          isOpen={showHistoryModal}
          onClose={closeHistoryModal}
          item={selectedItem}
          username={
            selectedItem.user_id ? getUsername(selectedItem.user_id) : undefined
          }
          usersData={robloxUsers}
        />
      )}
    </div>
  );
}
