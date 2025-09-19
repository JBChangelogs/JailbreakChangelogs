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
      className="relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border-2 border-gray-800 bg-gray-700 p-3 text-white transition-all duration-200 hover:border-gray-600 hover:shadow-lg"
      onClick={() => onCardClick(item)}
    >
      {/* Duplicate Indicator */}
      {isDuplicate && duplicateNumber && (
        <div
          className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg"
          aria-label={`Duplicate item number ${duplicateNumber}`}
        >
          #{duplicateNumber}
        </div>
      )}

      {/* Title */}
      <div className="mb-4 text-left">
        <p
          className={`${bangers.className} text-md mb-1 tracking-wide text-gray-300`}
        >
          {item.categoryTitle}
        </p>
        <h2
          className={`${bangers.className} text-2xl tracking-wide break-words`}
        >
          {item.title}
        </h2>
      </div>

      {/* Item Image */}
      <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg bg-[#212A31]">
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
          <div className="text-sm opacity-90">MONTHLY TRADED</div>
          <div className="text-xl font-bold">
            {formatNumber(item.timesTraded)}
          </div>
        </div>
        <div>
          <div className="text-sm opacity-90">MONTHLY UNIQUE</div>
          <div className="text-xl font-bold">
            {formatNumber(item.uniqueCirculation)}
          </div>
        </div>
        <div>
          <div className="text-sm opacity-90">CURRENT OWNER</div>
          <div className="text-xl font-bold italic">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
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
                className="text-center break-words text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {getUserDisplay(item.latest_owner)}
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm opacity-90">DUPED VALUE</div>
          <Tooltip
            title={dupedValue > 0 ? `$${dupedValue.toLocaleString()}` : "N/A"}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "#0F1419",
                  color: "#D3D9D4",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #2E3944",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "#0F1419",
                  },
                },
              },
            }}
          >
            <div
              className="cursor-help text-xl font-bold text-red-400"
              aria-label={`Duped value: ${dupedValue > 0 ? formatCurrencyValue(dupedValue) : "Not available"}`}
            >
              {dupedValue > 0 ? formatCurrencyValue(dupedValue) : "N/A"}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-sm opacity-90">CREATED AT</div>
          <div className="text-xl font-bold">
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
