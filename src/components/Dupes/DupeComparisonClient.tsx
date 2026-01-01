"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DupeFinderItem, Item } from "@/types";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import { getDupedValueForItem } from "@/utils/dupeUtils";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import { Icon } from "@/components/ui/IconWrapper";
import { CategoryIconBadge } from "@/utils/categoryIcons";
import TradeHistoryList from "./TradeHistoryList";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";
import localFont from "next/font/local";

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

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
}

function VariantColumn({
  title,
  item,
  splitIndex,
  robloxUsers,
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

      <div className="bg-secondary-bg border-border-primary relative flex flex-col rounded-lg border p-4">
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
            <div className="bg-tertiary-bg border-border-primary relative h-10 w-10 shrink-0 overflow-hidden rounded-full border transition-colors">
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
        <div className="border-border-primary mt-2 border-t pt-3 text-center">
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

      <div className="border-border-primary mt-4 border-t pt-4">
        <h3 className="text-primary-text mb-3 text-lg font-bold">
          Ownership History ({item.history?.length || 0})
        </h3>
        <div className="max-h-[700px] overflow-y-auto pr-1">
          <TradeHistoryList
            history={item.history || []}
            splitIndex={splitIndex}
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
  // Calculate Split Point (Oldest to Newest)
  // Calculate Split Point (Oldest to Newest)
  const calculateSplitIndex = (
    history1: { UserId: number; TradeTime: number }[],
    history2: { UserId: number; TradeTime: number }[],
  ) => {
    if (!history1 || !history2) return -1;
    // Arrays are Oldest (0) -> Newest (N)
    let k = 0;
    const len = Math.min(history1.length, history2.length);
    while (k < len) {
      if (
        history1[k].UserId !== history2[k].UserId
        // We only check UserId to allow for "Same Owner" history to flow through regardless of minor timestamp mismatch
        // This pushes the split line AFTER the shared owner sequence.
      ) {
        break;
      }
      k++;
    }
    // k is the properties index where they diverge (First Different Owner)
    return k;
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
            className="border-border-primary bg-secondary-bg text-primary-text hover:bg-tertiary-bg flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="h-5 w-5" />
            Back to Player Dupes
          </Link>
        </div>
      )}

      {/* Shared Summary Header */}
      <div className="bg-secondary-bg border-border-primary mx-auto max-w-3xl rounded-xl border p-6 text-center shadow-sm">
        <Link
          href={`/item/${duplicateItem.categoryTitle}/${duplicateItem.title}`}
          className="group mb-2 inline-flex items-center justify-center gap-3 transition-opacity"
        >
          <h2
            className={`${bangers.className} text-primary-text group-hover:text-link-hover text-3xl tracking-wide transition-colors`}
          >
            {sharedItemData.name}
          </h2>
        </Link>
        <div className="text-secondary-text mb-6 text-sm">
          Comparison of two known duplicates of this item.
        </div>

        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center">
          {/* Shared Image */}
          <div className="bg-secondary-bg border-border-primary relative h-40 w-full shrink-0 overflow-hidden rounded-lg border md:w-64">
            <div className="absolute top-2 left-2 z-10">
              <CategoryIconBadge
                type={duplicateItem.categoryTitle}
                isLimited={sharedItemData.is_limited === 1}
                isSeasonal={sharedItemData.is_seasonal === 1}
                hasChildren={false}
                preferItemType={true} // Shows item type icon if available
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
                    src={getDriftVideoPath(duplicateItem.title)}
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

          {/* Shared Stats */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-left">
            <div>
              <div className="text-secondary-text mb-1 text-xs font-bold tracking-wider uppercase">
                Monthly Unique
              </div>
              <div className="text-primary-text text-xl font-bold">
                {sharedItemData?.metadata?.UniqueCirculation
                  ? sharedItemData.metadata.UniqueCirculation.toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-secondary-text mb-1 text-xs font-bold tracking-wider uppercase">
                Monthly Traded
              </div>
              <div className="text-primary-text text-xl font-bold">
                {sharedItemData?.metadata?.TimesTraded
                  ? sharedItemData.metadata.TimesTraded.toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-secondary-text mb-1 text-xs font-bold tracking-wider uppercase">
                Status
              </div>
              <div className="text-primary-text text-xl font-bold">
                {sharedItemData?.is_limited === 1
                  ? "Limited"
                  : sharedItemData?.is_seasonal === 1
                    ? "Seasonal"
                    : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-secondary-text mb-1 text-xs font-bold tracking-wider uppercase">
                Duped Value
              </div>
              <div className="text-primary-text text-xl font-bold">
                {(() => {
                  const val = getDupedValueForItem(
                    sharedItemData,
                    duplicateItem,
                  );
                  return val > 0 ? `$${val.toLocaleString()}` : "N/A";
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <VariantColumn
          title="Selected Item"
          item={duplicateItem}
          splitIndex={selectedSplitIndex}
          robloxUsers={robloxUsers}
        />
        <VariantColumn
          title="Other Variant"
          item={ogItem}
          splitIndex={variantSplitIndex}
          robloxUsers={robloxUsers}
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
        />
      )}
    </div>
  );
}
