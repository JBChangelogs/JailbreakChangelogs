"use client";

import Image from "next/image";
import { DefaultAvatar } from "@/utils/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/ui/images";
import { getCategoryIcon, getCategoryColor } from "@/utils/items/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { formatFullValue } from "@/utils/trading/values";
import { Item } from "@/types";
import {
  fetchItemUnlockMetadataById,
  ItemUnlockMetadataEntry,
} from "@/utils/items/itemUnlockMetadata";
import {
  formatUnlockLevelBadge,
  formatPlacementBadge,
  formatUnlockRequirementsTooltip,
  hasUnlockLevel,
} from "@/utils/items/itemUnlockPresentation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { bangers } from "@/app/fonts";

// Helper function to format numbers with commas
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

// Helper function to format date
const formatDateOnly = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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
  user_id: string;
  logged_at: number;
  history?: string | Array<{ UserId: number; TradeTime: number }>;
}

interface OGItemCardProps {
  item: OGItem;
  itemData?: Item;
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
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [itemUnlockMetadata, setItemUnlockMetadata] =
    useState<ItemUnlockMetadataEntry | null>(null);
  const isOriginalOwner = item.isOriginalOwner;
  const isDuplicate = duplicateCount > 1;
  const displayedSeason =
    typeof item.season === "number" ? item.season : undefined;
  const displayedLevel =
    typeof item.level === "number" ? String(item.level) : undefined;
  const displayedPlacement =
    typeof itemUnlockMetadata?.placement === "string"
      ? itemUnlockMetadata.placement
      : undefined;
  const hasDisplayedLevel = hasUnlockLevel(displayedLevel);
  const requirementsTooltipText = formatUnlockRequirementsTooltip(
    displayedSeason,
    displayedLevel,
    displayedPlacement,
  );

  useEffect(() => {
    let isMounted = true;
    fetchItemUnlockMetadataById()
      .then((metadataById) => {
        if (!isMounted) return;
        setItemUnlockMetadata(metadataById.get(item.item_id) ?? null);
      })
      .catch(() => {
        if (isMounted) setItemUnlockMetadata(null);
      });
    return () => {
      isMounted = false;
    };
  }, [item.item_id]);

  /* oxlint-disable jsx-a11y/prefer-tag-over-role */
  return (
    <div
      className="border-border-card bg-tertiary-bg text-primary-text hover:shadow-card-shadow relative flex min-h-100 cursor-pointer flex-col rounded-lg border p-3 transition-all duration-200"
      onClick={() => onCardClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCardClick(item);
        }
      }}
    >
      {/* Duplicate Indicator */}
      {isDuplicate && (
        <div className="bg-button-danger text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
          #{duplicateOrder}
        </div>
      )}

      {/* OG Badge */}
      {isOriginalOwner && !isDuplicate && (
        <div className="bg-status-success text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
          OG
        </div>
      )}

      {/* Title */}
      <div className="mb-4 text-left">
        <h2
          className={`${bangers.className} text-primary-text mb-1 text-2xl tracking-wide wrap-break-word`}
        >
          <Link
            href={`/item/${encodeURIComponent(item.categoryTitle)}/${encodeURIComponent(item.title)}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-link-hover transition-colors"
            prefetch={false}
          >
            {item.title}
          </Link>
        </h2>
        <div className="flex items-center gap-2">
          <span
            className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium backdrop-blur-xl"
            style={{
              borderColor: getCategoryColor(item.categoryTitle),
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
            {item.categoryTitle}
          </span>
        </div>
      </div>

      {/* Item Image - Always show container for consistent layout */}
      <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg">
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
              src={getItemImagePath(item.categoryTitle, item.title, true)}
              alt={item.title}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          )
        ) : (
          <Image
            src={getItemImagePath(item.categoryTitle, item.title, true)}
            alt={item.title}
            fill
            className="object-cover"
            onError={handleImageError}
          />
        )}
      </div>

      {/* Statistics */}
      <div className="flex flex-1 flex-col justify-center space-y-2 text-center">
        <div>
          <div className="text-secondary-text text-sm">MONTHLY UNIQUE</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-primary-text cursor-help text-xl font-bold">
                {formatNumber(item.uniqueCirculation)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Monthly unique: {item.uniqueCirculation.toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Cash Value */}
        {itemData && (
          <div>
            <div className="text-secondary-text text-sm">CASH VALUE</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-primary-text cursor-help text-xl font-bold">
                  <span className="sm:hidden">
                    {itemData.cash_value === null ||
                    itemData.cash_value === "N/A"
                      ? "N/A"
                      : itemData.cash_value}
                  </span>
                  <span className="hidden sm:inline">
                    {formatFullValue(itemData.cash_value)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {formatFullValue(itemData.cash_value)}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Duped Value */}
        {itemData && (
          <div>
            <div className="text-secondary-text text-sm">DUPED VALUE</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-primary-text cursor-help text-xl font-bold">
                  <span className="sm:hidden">
                    {itemData.duped_value === null ||
                    itemData.duped_value === "N/A"
                      ? "N/A"
                      : itemData.duped_value}
                  </span>
                  <span className="hidden sm:inline">
                    {formatFullValue(itemData.duped_value)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Duped value: {formatFullValue(itemData.duped_value)}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <div>
          <div className="text-secondary-text text-sm">CURRENT OWNER</div>
          <div className="text-xl font-bold">
            <div className="flex items-center justify-center gap-2">
              <div className="border-border-card bg-quaternary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
                {avatarError ? (
                  <DefaultAvatar name={getUsername(item.user_id)} />
                ) : (
                  <>
                    {isAvatarLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner className="h-4 w-4" />
                      </div>
                    )}
                    <Image
                      src={getUserAvatar(item.user_id)}
                      alt="Owner Avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                      onLoad={() => setIsAvatarLoading(false)}
                      onError={() => {
                        setIsAvatarLoading(false);
                        setAvatarError(true);
                      }}
                    />
                  </>
                )}
              </div>
              <a
                href={`https://www.roblox.com/users/${item.user_id}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover text-center wrap-break-word transition-colors hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="inline-flex items-center gap-2">
                  {getUsername(item.user_id)}
                  {getHasVerifiedBadge && getHasVerifiedBadge(item.user_id) && (
                    <VerifiedBadgeIcon className="h-4 w-4" />
                  )}
                </span>
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="text-secondary-text text-sm">LOGGED ON</div>
          <div className="text-primary-text text-xl font-bold">
            {formatDateOnly(item.logged_at)}
          </div>
        </div>
      </div>

      {/* Season, Level, and Placement badges */}
      <div className="mt-3 flex min-h-10 justify-center gap-2 pt-3">
        {(typeof displayedSeason === "number" ||
          hasDisplayedLevel ||
          displayedPlacement) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-1">
                {typeof displayedSeason === "number" && (
                  <span className="bg-button-info text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                    S{displayedSeason}
                  </span>
                )}
                {hasDisplayedLevel && (
                  <span className="bg-status-success text-form-button-text inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold">
                    {formatUnlockLevelBadge(displayedLevel)}
                  </span>
                )}
                {!hasDisplayedLevel && displayedPlacement && (
                  <span className="bg-status-warning inline-flex h-6 items-center rounded-lg px-2 text-xs leading-none font-bold text-black">
                    {formatPlacementBadge(displayedPlacement)}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>{requirementsTooltipText}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
  /* oxlint-enable jsx-a11y/prefer-tag-over-role */
}
