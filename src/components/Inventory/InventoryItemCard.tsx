"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import { Item } from "@/types";
import { InventoryItem } from "@/app/inventories/types";
import { formatCurrencyValue, parseCurrencyValue } from "@/utils/currency";
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

// Helper function to format numbers with commas
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

interface InventoryItemCardProps {
  item: InventoryItem;
  itemData: Item;
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  onCardClick: (item: InventoryItem) => void;
  duplicateCount?: number;
  duplicateOrder?: number;
  userId: string;
}

export default function InventoryItemCard({
  item,
  itemData,
  getUserDisplay,
  getUserAvatar,
  onCardClick,
  duplicateCount = 1,
  duplicateOrder = 1,
  userId,
}: InventoryItemCardProps) {
  const isOriginalOwner = item.isOriginalOwner;
  const originalOwnerInfo = item.info.find(
    (info) => info.title === "Original Owner",
  );
  const isDuplicate = duplicateCount > 1;

  return (
    <div
      className={`relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border-2 p-3 text-white transition-all duration-200 hover:shadow-lg ${
        isOriginalOwner
          ? "border-yellow-400 bg-yellow-600/30 backdrop-blur-sm hover:border-yellow-300"
          : "border-gray-800 bg-gray-700 hover:border-gray-600"
      }`}
      onClick={() => onCardClick(item)}
    >
      {/* Duplicate Indicator */}
      {isDuplicate && (
        <div className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
          #{duplicateOrder}
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

      {/* Item Image - Always show container for consistent layout */}
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
          <div className="text-sm opacity-90">ORIGINAL OWNER</div>
          <div className="text-xl font-bold italic">
            {originalOwnerInfo ? (
              <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                {/* Always show avatar container - use placeholder when no avatar available */}
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                  {(isOriginalOwner && getUserAvatar(userId)) ||
                  (!isOriginalOwner &&
                    getUserAvatar(originalOwnerInfo.value)) ? (
                    <Image
                      src={
                        isOriginalOwner
                          ? getUserAvatar(userId)!
                          : getUserAvatar(originalOwnerInfo.value)!
                      }
                      alt="Original Owner Avatar"
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>
                <a
                  href={`https://www.roblox.com/users/${isOriginalOwner ? userId : originalOwnerInfo.value}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center break-words text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isOriginalOwner
                    ? getUserDisplay(userId)
                    : getUserDisplay(originalOwnerInfo.value)}
                </a>
              </div>
            ) : (
              <span className="text-sm">Unknown</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm opacity-90">CASH VALUE</div>
          <Tooltip
            title={
              itemData.cash_value === null || itemData.cash_value === "N/A"
                ? "N/A"
                : `$${parseCurrencyValue(itemData.cash_value).toLocaleString()}`
            }
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
            <div className="cursor-help text-xl font-bold text-white">
              {itemData.cash_value === null || itemData.cash_value === "N/A"
                ? "N/A"
                : formatCurrencyValue(parseCurrencyValue(itemData.cash_value))}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-sm opacity-90">DUPED VALUE</div>
          <Tooltip
            title={(() => {
              let dupedValue = itemData.duped_value;

              // If main item doesn't have duped value, check children/variants based on created date
              if (
                (dupedValue === null || dupedValue === "N/A") &&
                itemData.children
              ) {
                // Get the year from the created date (from item info)
                const createdAtInfo = item.info.find(
                  (info) => info.title === "Created At",
                );
                const createdYear = createdAtInfo
                  ? new Date(createdAtInfo.value).getFullYear().toString()
                  : null;

                // Find the child variant that matches the created year
                const matchingChild = createdYear
                  ? itemData.children.find(
                      (child) =>
                        child.sub_name === createdYear &&
                        child.data &&
                        child.data.duped_value &&
                        child.data.duped_value !== "N/A" &&
                        child.data.duped_value !== null,
                    )
                  : null;

                if (matchingChild) {
                  dupedValue = matchingChild.data.duped_value;
                }
              }

              return dupedValue === null || dupedValue === "N/A"
                ? "N/A"
                : `$${parseCurrencyValue(dupedValue).toLocaleString()}`;
            })()}
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
            <div className="cursor-help text-xl font-bold text-white">
              {(() => {
                let dupedValue = itemData.duped_value;

                // If main item doesn't have duped value, check children/variants based on created date
                if (
                  (dupedValue === null || dupedValue === "N/A") &&
                  itemData.children
                ) {
                  // Get the year from the created date (from item info)
                  const createdAtInfo = item.info.find(
                    (info) => info.title === "Created At",
                  );
                  const createdYear = createdAtInfo
                    ? new Date(createdAtInfo.value).getFullYear().toString()
                    : null;

                  // Find the child variant that matches the created year
                  const matchingChild = createdYear
                    ? itemData.children.find(
                        (child) =>
                          child.sub_name === createdYear &&
                          child.data &&
                          child.data.duped_value &&
                          child.data.duped_value !== "N/A" &&
                          child.data.duped_value !== null,
                      )
                    : null;

                  if (matchingChild) {
                    dupedValue = matchingChild.data.duped_value;
                  }
                }

                return dupedValue === null || dupedValue === "N/A"
                  ? "N/A"
                  : formatCurrencyValue(parseCurrencyValue(dupedValue));
              })()}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-sm opacity-90">CREATED ON</div>
          <div className="text-xl font-bold">
            {item.info.find((info) => info.title === "Created At")?.value ||
              "N/A"}
          </div>
        </div>
      </div>

      {/* Season and Level badges - always show container for consistent layout */}
      <div className="mt-3 flex min-h-[40px] justify-center gap-2 border-t border-white/20 pt-3">
        {item.season && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-600 shadow-lg">
            <span className="text-xs font-bold text-white">S{item.season}</span>
          </div>
        )}
        {item.level && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-green-600 shadow-lg">
            <span className="text-xs font-bold text-white">L{item.level}</span>
          </div>
        )}
      </div>
    </div>
  );
}
