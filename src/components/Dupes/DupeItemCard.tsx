"use client";

import Image from "next/image";
import Link from "next/link";
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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { bangers } from "@/app/fonts";

interface DupeItemCardProps {
  item: DupeFinderItem;
  itemData: Item;
  getUserAvatar: (userId: string) => string;
  getUsername: (userId: string) => string;
  getDupedValueForItem: (itemData: Item, dupeItem: DupeFinderItem) => number;
  onCardClick: (item: DupeFinderItem) => void;
  duplicateNumber?: number;
  isDuplicate?: boolean;
  robloxId: string;
  ownerLabel?: string;
  bgClass?: string;
  isDupedItem?: boolean;
}

export default function DupeItemCard({
  item,
  itemData,
  getUserAvatar,
  getUsername,
  getDupedValueForItem,
  onCardClick,
  duplicateNumber,
  isDuplicate = false,
  robloxId,
  ownerLabel = "ORIGINAL OWNER",
  isDupedItem = false,
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
      className={`text-primary-text relative flex cursor-pointer flex-col rounded-lg border p-3 transition-all duration-200 ${
        isDupedItem
          ? "bg-button-danger/10 border-button-danger"
          : "border-border-card bg-tertiary-bg"
      }`}
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
        <h2
          className={`${bangers.className} text-primary-text mb-1 text-2xl tracking-wide wrap-break-word`}
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
        <div className="flex items-center gap-2">
          <span
            className="text-primary-text bg-tertiary-bg/40 flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
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
          {isDupedItem && (
            <span className="border-button-danger bg-button-danger text-form-button-text flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
              Duped
            </span>
          )}
        </div>
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
                {itemData?.metadata?.UniqueCirculation
                  ? formatNumber(itemData.metadata.UniqueCirculation)
                  : item.uniqueCirculation
                    ? formatNumber(item.uniqueCirculation)
                    : "N/A"}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Monthly unique: {item.uniqueCirculation.toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <div className="text-secondary-text text-sm">MONTHLY TRADED</div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-primary-text cursor-help text-xl font-bold">
                {itemData?.metadata?.TimesTraded
                  ? formatNumber(itemData.metadata.TimesTraded)
                  : "N/A"}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Monthly traded:{" "}
              {itemData?.metadata?.TimesTraded
                ? itemData.metadata.TimesTraded.toLocaleString()
                : "N/A"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <div className="text-secondary-text text-sm">DUPED VALUE</div>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent>
              Duped value:{" "}
              {dupedValue > 0 ? `$${dupedValue.toLocaleString()}` : "N/A"}
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <div className="text-secondary-text text-sm">{ownerLabel}</div>
          <div className="text-xl font-bold">
            <div className="flex items-center justify-center gap-2">
              <div className="border-border-card bg-tertiary-bg relative h-8 w-8 shrink-0 overflow-hidden rounded-full border">
                <Image
                  src={getUserAvatar(robloxId)}
                  alt="Original Owner Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector("svg")) {
                      const defaultAvatar = document.createElement("div");
                      defaultAvatar.className =
                        "flex h-full w-full items-center justify-center";
                      defaultAvatar.innerHTML = `<svg class="h-5 w-5 text-tertiary-text" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>`;
                      parent.appendChild(defaultAvatar);
                    }
                  }}
                />
              </div>
              <a
                href={`https://www.roblox.com/users/${robloxId}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover text-center wrap-break-word transition-colors hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {getUsername(robloxId)}
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

      {/* Season and Level badges - centered like other cards */}
      <div className="border-secondary-text mt-3 flex min-h-[40px] items-center justify-center gap-2 border-t pt-3">
        {item.season && (
          <div className="border-button-info bg-button-info flex h-8 w-8 items-center justify-center rounded-full border shadow-lg">
            <span className="text-form-button-text text-xs font-bold">
              S{item.season}
            </span>
          </div>
        )}
        {item.level && (
          <div className="border-status-success bg-status-success flex h-8 w-8 items-center justify-center rounded-full border shadow-lg">
            <span className="text-form-button-text text-xs font-bold">
              L{item.level}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
