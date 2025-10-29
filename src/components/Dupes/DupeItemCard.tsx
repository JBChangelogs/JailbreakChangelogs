"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import { DupeFinderItem, Item } from "@/types";
import { formatCurrencyValue } from "@/utils/currency";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

interface DupeItemCardProps {
  item: DupeFinderItem;
  itemData: Item;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge?: (userId: string) => boolean;
  getDupedValueForItem: (itemData: Item, dupeItem: DupeFinderItem) => number;
  onCardClick: (item: DupeFinderItem) => void;
  duplicateNumber?: number;
  isDuplicate?: boolean;
}

export default function DupeItemCard({
  item,
  itemData,
  getUserDisplay,
  // getUserAvatar,
  getHasVerifiedBadge,
  getDupedValueForItem,
  onCardClick,
  duplicateNumber,
  isDuplicate = false,
}: DupeItemCardProps) {
  const dupedValue = getDupedValueForItem(itemData, item);

  // Helper function to format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Helper function to format date only (matches old implementation)
  const formatDateOnly = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="border-border-primary bg-primary-bg text-primary-text hover:border-border-focus hover:shadow-card-shadow relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border p-3 transition-all duration-200"
      onClick={() => onCardClick(item)}
    >
      {/* Duplicate Indicator */}
      {isDuplicate && duplicateNumber && (
        <div
          className="bg-button-danger text-form-button-text absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg"
          aria-label={`Duplicate item number ${duplicateNumber}`}
        >
          #{duplicateNumber}
        </div>
      )}

      {/* Title */}
      <div className="mb-4 text-left">
        <div className="mb-1 flex items-center gap-2">
          <span
            className="text-primary-text flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
            style={{
              borderColor: getCategoryColor(item.categoryTitle),
              backgroundColor: getCategoryColor(item.categoryTitle) + "20", // Add 20% opacity
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
        <h2
          className={`${bangers.className} text-primary-text text-2xl tracking-wide break-words`}
        >
          <Link
            href={`/item/${encodeURIComponent(item.categoryTitle.toLowerCase())}/${encodeURIComponent(item.title)}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-link-hover transition-colors"
            prefetch={false}
          >
            {item.title}
          </Link>
        </h2>
      </div>

      {/* Item Image */}
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
              onError={(e) => {
                console.log("Video error:", e);
              }}
              onAbort={(e) => {
                console.log("Video aborted by browser power saving:", e);
              }}
              onPause={(e) => {
                console.log("Video paused:", e);
              }}
              onPlay={(e) => {
                console.log("Video play attempted:", e);
              }}
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
                src={getDriftVideoPath(item.title)}
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
          <Tooltip
            title={item.uniqueCirculation.toLocaleString()}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <div className="text-primary-text cursor-help text-xl font-bold">
              {formatNumber(item.uniqueCirculation)}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-secondary-text text-sm">CURRENT OWNER</div>
          <div className="text-xl font-bold">
            <a
              href={`https://www.roblox.com/users/${item.latest_owner}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover text-center break-words transition-colors hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="inline-flex items-center gap-2">
                {getUserDisplay(item.latest_owner)}
                {getHasVerifiedBadge &&
                  getHasVerifiedBadge(item.latest_owner) && (
                    <VerifiedBadgeIcon className="h-4 w-4" />
                  )}
              </span>
            </a>
          </div>
        </div>
        <div>
          <div className="text-secondary-text text-sm">DUPED VALUE</div>
          <Tooltip
            title={dupedValue > 0 ? `$${dupedValue.toLocaleString()}` : "N/A"}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <div
              className="text-primary-text cursor-help text-xl font-bold"
              aria-label={`Duped value: ${dupedValue > 0 ? formatCurrencyValue(dupedValue) : "Not available"}`}
            >
              <span className="sm:hidden">
                {dupedValue > 0 ? formatCurrencyValue(dupedValue) : "N/A"}
              </span>
              <span className="hidden sm:inline">
                {dupedValue > 0 ? `$${dupedValue.toLocaleString()}` : "N/A"}
              </span>
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-secondary-text text-sm">LOGGED ON</div>
          <Tooltip
            title={new Date(item.logged_at * 1000).toLocaleString()}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <div className="text-primary-text cursor-help text-xl font-bold">
              {formatDateOnly(item.logged_at)}
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
