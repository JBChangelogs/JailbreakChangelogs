"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import { DupeFinderItem, Item } from "@/types";
import { formatCurrencyValue } from "@/utils/currency";
import { DefaultAvatar } from "@/utils/avatar";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

interface DupeItemCardProps {
  item: DupeFinderItem;
  itemData: Item;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getDupedValueForItem: (itemData: Item, dupeItem: DupeFinderItem) => number;
  onCardClick: (item: DupeFinderItem) => void;
  duplicateNumber?: number;
  isDuplicate?: boolean;
}

export default function DupeItemCard({
  item,
  itemData,
  getUserDisplay,
  getUserAvatar,
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
          className="bg-button-danger text-form-button-text absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg"
          aria-label={`Duplicate item number ${duplicateNumber}`}
        >
          #{duplicateNumber}
        </div>
      )}

      {/* Title */}
      <div className="mb-4 text-left">
        <p
          className={`${bangers.className} text-md text-secondary-text mb-1 tracking-wide`}
        >
          {item.categoryTitle}
        </p>
        <h2
          className={`${bangers.className} text-primary-text text-2xl tracking-wide break-words`}
        >
          {item.title}
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
          <div className="text-secondary-text text-sm">MONTHLY TRADED</div>
          <div className="text-primary-text text-xl font-bold">
            {formatNumber(item.timesTraded)}
          </div>
        </div>
        <div>
          <div className="text-secondary-text text-sm">MONTHLY UNIQUE</div>
          <div className="text-primary-text text-xl font-bold">
            {formatNumber(item.uniqueCirculation)}
          </div>
        </div>
        <div>
          <div className="text-secondary-text text-sm">CURRENT OWNER</div>
          <div className="text-xl font-bold italic">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <div className="border-border-primary bg-surface-bg flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border">
                {getUserAvatar(item.latest_owner) ? (
                  <Image
                    src={getUserAvatar(item.latest_owner)!}
                    alt="Current Owner Avatar"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <a
                href={`https://www.roblox.com/users/${item.latest_owner}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover text-center break-words transition-colors hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {getUserDisplay(item.latest_owner)}
              </a>
            </div>
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
              {dupedValue > 0 ? formatCurrencyValue(dupedValue) : "N/A"}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-secondary-text text-sm">CREATED AT</div>
          <div className="text-primary-text text-xl font-bold">
            {(() => {
              const createdAtInfo = item.info.find(
                (info) => info.title === "Created At",
              );
              return createdAtInfo
                ? formatDateOnly(new Date(createdAtInfo.value).getTime() / 1000)
                : "N/A";
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
