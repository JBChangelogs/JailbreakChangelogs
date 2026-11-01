"use client";

import type { CatalogValues } from "@/hooks/usePartialItems";
import Image from "next/image";
import { IMAGE_PLACEHOLDER } from "@/utils/ui/imagePlaceholder";
import { DefaultAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { useState } from "react";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/ui/images";
import {
  getCategoryIcon,
  getCategoryColor,
  CategoryIconBadge,
} from "@/utils/items/categoryIcons";
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

import { bangers } from "@/app/fonts";
import ItemSignatures from "@/components/Items/ItemSignatures";
import { formatMonthDayYear } from "@/utils/helpers/timestamp";
import InventoryMarketSummary from "@/components/Inventory/InventoryMarketSummary";
import { Button } from "@/components/ui/button";

interface OGItem {
  tradePopularMetric: number;
  level: number | null;
  timesTraded: number;
  id: string;
  item_id: number;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  Sign?: string[] | null;
  user_id: string;
  logged_at: number;
  history?: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGItemCardProps {
  item: OGItem;
  itemData?: CatalogValues;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
  onCardClick: (item: OGItem) => void;
  duplicateCount?: number;
  duplicateOrder?: number;
}

export default function OGItemCard({
  item,
  itemData,
  getUsername,
  getUserAvatar,
  getHasVerifiedBadge,
  onCardClick,
  duplicateCount = 1,
  duplicateOrder = 1,
}: OGItemCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const isOriginalOwner = item.isOriginalOwner;
  const isDuplicate = duplicateCount > 1;
  const displayedSeason = itemData?.season ?? undefined;
  const displayedLevel = unlockLevel(itemData?.level);
  const isSeasonal = itemData?.is_seasonal === 1 || hasSeason(itemData);
  const hasDisplayedLevel = hasUnlockLevel(displayedLevel);
  const requirementsTooltipText = formatUnlockRequirementsTooltip(
    displayedSeason,
    displayedLevel,
  );

  return (
    <div className="border-border-card bg-tertiary-bg text-primary-text relative flex flex-col rounded-lg border p-3">
      {isDuplicate && (
        <div className="bg-button-info text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
          #{duplicateOrder}
        </div>
      )}

      {isOriginalOwner && !isDuplicate && (
        <div className="bg-status-success text-button-success-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
          OG
        </div>
      )}

      <div className="mb-4 text-left">
        <h2
          className={`${bangers.className} text-primary-text mb-1 text-2xl tracking-wide wrap-break-word`}
        >
          <Link
            href={`/item/${encodeURIComponent(item.categoryTitle)}/${encodeURIComponent(item.title)}`}
            className="hover:text-link-hover transition-colors"
            prefetch={false}
          >
            {item.title}
          </Link>
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
            style={{
              borderColor: getCategoryColor(item.categoryTitle),
              backgroundColor: `${getCategoryColor(item.categoryTitle)}22`,
            }}
          >
            {(() => {
              const categoryIcon = getCategoryIcon(item.categoryTitle);
              return categoryIcon ? (
                <categoryIcon.Icon
                  className="h-3 w-3"
                  style={{ color: getCategoryColor(item.categoryTitle) }}
                />
              ) : null;
            })()}
            <span>{item.categoryTitle}</span>
          </span>
        </div>
      </div>

      <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
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
        {!["Brakes"].includes(item.categoryTitle) ? (
          isVideoItem(item.title) ? (
            <video
              src={getVideoPath(item.categoryTitle, item.title)}
              className="h-full w-full object-cover"
              muted
              playsInline
              loop
              autoPlay
            />
          ) : isDriftItem(item.categoryTitle) ? (
            <div className="relative h-full w-full">
              <Image
                placeholder={IMAGE_PLACEHOLDER}
                src={getItemImagePath(item.categoryTitle, item.title, true)}
                alt={item.title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
              <video
                src={getDriftVideoPath(item.title, true)}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                muted
                playsInline
                loop
              />
            </div>
          ) : (
            <Image
              placeholder={IMAGE_PLACEHOLDER}
              src={getItemImagePath(item.categoryTitle, item.title, true)}
              alt={item.title}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          )
        ) : (
          <Image
            placeholder={IMAGE_PLACEHOLDER}
            src={getItemImagePath(item.categoryTitle, item.title, true)}
            alt={item.title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        )}
        <ItemSignatures signs={item.Sign} />
      </div>

      <InventoryMarketSummary data={itemData} />

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="border-border-card bg-quaternary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
            {avatarError ? (
              <DefaultAvatar name={getUsername(item.user_id)} />
            ) : (
              <Image
                src={getUserAvatar(item.user_id)}
                alt="Current owner avatar"
                width={32}
                height={32}
                className="rounded-full"
                onError={() => setAvatarError(true)}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-secondary-text text-xs">Current owner</p>
            <a
              href={`https://www.roblox.com/users/${item.user_id}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <span className="truncate">{getUsername(item.user_id)}</span>
              {getHasVerifiedBadge?.(item.user_id) && (
                <VerifiedBadgeIcon className="h-3.5 w-3.5 shrink-0" />
              )}
            </a>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-secondary-text min-w-0 text-sm">
            Logged {formatMonthDayYear(item.logged_at)}
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
    </div>
  );
}
