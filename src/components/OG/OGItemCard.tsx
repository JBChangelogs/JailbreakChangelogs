"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
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
  getUserDisplay: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  onCardClick: (item: OGItem) => void;
  duplicateCount?: number;
  duplicateOrder?: number;
}

export default function OGItemCard({
  item,
  getUserDisplay,
  getUserAvatar,
  onCardClick,
  duplicateCount = 1,
  duplicateOrder = 1,
}: OGItemCardProps) {
  const isOriginalOwner = item.isOriginalOwner;
  const isDuplicate = duplicateCount > 1;

  return (
    <div
      className={`relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border-2 p-3 text-white transition-all duration-200 hover:shadow-lg ${
        isOriginalOwner
          ? "border-green-400 bg-green-600/30 backdrop-blur-sm hover:border-green-300"
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

      {/* OG Badge */}
      {isOriginalOwner && !isDuplicate && (
        <div className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white shadow-lg">
          OG
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
          <Tooltip
            title={item.timesTraded.toLocaleString()}
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
            <div className="cursor-help text-xl font-bold">
              {formatNumber(item.timesTraded)}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-sm opacity-90">MONTHLY UNIQUE</div>
          <Tooltip
            title={item.uniqueCirculation.toLocaleString()}
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
            <div className="cursor-help text-xl font-bold">
              {formatNumber(item.uniqueCirculation)}
            </div>
          </Tooltip>
        </div>
        <div>
          <div className="text-sm opacity-90">CURRENT OWNER</div>
          <div className="text-xl font-bold italic">
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              {/* Always show avatar container - use placeholder when no avatar available */}
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                {getUserAvatar(item.user_id) ? (
                  <Image
                    src={getUserAvatar(item.user_id)!}
                    alt="Current Owner Avatar"
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
                href={`https://www.roblox.com/users/${item.user_id}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center break-words text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {getUserDisplay(item.user_id)}
              </a>
            </div>
          </div>
        </div>
        <div>
          <div className="text-sm opacity-90">LOGGED ON</div>
          <div className="text-xl font-bold">
            {formatDateOnly(item.logged_at)}
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
