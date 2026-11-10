"use client";

import type { CatalogValues } from "@/hooks/usePartialItems";
import { getDupeComparisonUrl } from "@/utils/dupeComparisonUrl";
import Image from "next/image";
import { DefaultAvatar } from "@/utils/ui/avatar";

import Link from "next/link";
import { useState } from "react";
import { InventoryItem } from "@/app/inventories/types";
import { CategoryIconBadge } from "@/utils/items/categoryIcons";
import InventoryItemAppearance from "./InventoryItemAppearance";
import InventoryMarketSummary from "./InventoryMarketSummary";
import { Button } from "@/components/ui/button";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { hasSeason, unlockLevel } from "@/utils/items/season";
import {
  formatUnlockLevelBadge,
  formatUnlockRequirementsTooltip,
  hasUnlockLevel,
} from "@/utils/items/itemUnlockPresentation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InventoryItemCardProps {
  item: InventoryItem;
  itemData?: CatalogValues;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
  onCardClick: (item: InventoryItem) => void;
  duplicateCount?: number;
  duplicateOrder?: number;
  userId: string;
  isDupedItem?: boolean;
}

export default function InventoryItemCard({
  item,
  itemData,
  getUserDisplay,
  getUserAvatar,
  getHasVerifiedBadge,
  onCardClick,
  duplicateCount = 1,
  duplicateOrder = 1,
  userId,
  isDupedItem = false,
}: InventoryItemCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const isOriginalOwner = item.isOriginalOwner;
  const originalOwnerInfo = item.info.find(
    (info) => info.title === "Original Owner",
  );
  const isDuplicate = duplicateCount > 1;
  const isMissingItem = item.id.startsWith("missing-");
  const originalOwnerId = isOriginalOwner ? userId : originalOwnerInfo?.value;
  const createdAt = item.info.find(
    (info) => info.title === "Created At",
  )?.value;
  const displayedSeason = itemData?.season ?? undefined;
  const displayedLevel = unlockLevel(itemData?.level);
  const isSeasonal = itemData?.is_seasonal === 1 || hasSeason(itemData);
  const hasDisplayedLevel = hasUnlockLevel(displayedLevel);
  const requirementsTooltipText = formatUnlockRequirementsTooltip(
    displayedSeason,
    displayedLevel,
  );

  return (
    <div
      className={`text-primary-text relative flex flex-col rounded-lg border p-3 transition-all duration-200 ${
        isOriginalOwner
          ? "hover:shadow-card-shadow border-[#FFD700] bg-[#FFD700]/10 hover:border-[#FFD700]"
          : "border-border-card bg-tertiary-bg"
      }`}
    >
      {isDuplicate && (
        <div className="bg-button-info text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
          #{duplicateOrder}
        </div>
      )}

      <InventoryItemAppearance
        title={item.title}
        categoryTitle={item.categoryTitle}
        signs={item.Sign}
      >
        {(itemData?.is_limited === 1 || isSeasonal) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 right-2 z-10">
                <CategoryIconBadge
                  type={item.categoryTitle}
                  isLimited={itemData?.is_limited === 1}
                  isSeasonal={isSeasonal}
                  className="h-4 w-4"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isSeasonal ? "Seasonal item" : "Limited item"}
            </TooltipContent>
          </Tooltip>
        )}
        {(displayedSeason != null || hasDisplayedLevel) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute right-2 bottom-2 z-10 flex cursor-help items-center gap-1">
                {typeof displayedSeason === "number" && (
                  <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
                    S{displayedSeason}
                  </span>
                )}
                {hasDisplayedLevel && (
                  <span className="bg-status-success text-button-success-text inline-flex h-6 items-center rounded-md px-2 text-xs leading-none font-bold">
                    {formatUnlockLevelBadge(displayedLevel)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>{requirementsTooltipText}</TooltipContent>
          </Tooltip>
        )}
      </InventoryItemAppearance>

      <InventoryMarketSummary data={itemData} isDuped={isDupedItem} />
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {originalOwnerId && !isMissingItem && (
            <div className="border-border-card bg-quaternary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
              {avatarError ? (
                <DefaultAvatar name={getUserDisplay(originalOwnerId)} />
              ) : (
                <Image
                  src={getUserAvatar(originalOwnerId)}
                  alt="Original owner avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={() => setAvatarError(true)}
                />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-secondary-text text-xs">Original owner</p>
            {isMissingItem ? (
              <p>???</p>
            ) : originalOwnerId ? (
              <a
                href={`https://www.roblox.com/users/${originalOwnerId}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <span className="truncate">
                  {getUserDisplay(originalOwnerId)}
                </span>
                {getHasVerifiedBadge?.(originalOwnerId) && (
                  <VerifiedBadgeIcon className="h-3.5 w-3.5 shrink-0" />
                )}
              </a>
            ) : (
              <p className="text-secondary-text text-sm">Unknown</p>
            )}
            {originalOwnerId && !isMissingItem && !isOriginalOwner && (
              <Link
                href={`/inventories/${encodeURIComponent(originalOwnerId)}`}
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover text-xs hover:underline"
              >
                Check inventory
              </Link>
            )}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-secondary-text min-w-0 text-sm">
            Created {isMissingItem ? "???" : createdAt || "date unknown"}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onCardClick(item)}
          >
            History
          </Button>
        </div>
      </div>

      {isDupedItem && (
        <div className="mt-3 flex flex-col items-center gap-1 text-center text-xs">
          <span className="text-secondary-text">This item may be duped.</span>
          <Link
            href={getDupeComparisonUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            title="View variant ownership histories in a new tab"
            className="text-link hover:text-link-hover font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Comparison
          </Link>
        </div>
      )}
    </div>
  );
}
