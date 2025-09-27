"use client";

import React from "react";
import { Season } from "@/types/seasons";
import { InventoryData } from "@/app/inventories/types";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/timestamp";
import XpProgressBar from "./XpProgressBar";
import dynamic from "next/dynamic";
import Image from "next/image";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

// Gamepass mapping with links and image names
const gamepassData = {
  PremiumGarage: {
    link: "https://www.roblox.com/game-pass/2725211/Pro-Garage",
    image: "PremiumGarage",
  },
  DuffelBag: {
    link: "https://www.roblox.com/game-pass/2219040/Duffel-Bag",
    image: "DuffelBag",
  },
  SWAT: {
    link: "https://www.roblox.com/game-pass/2070427/SWAT-Team",
    image: "SWAT",
  },
  Stereo: {
    link: "https://www.roblox.com/game-pass/2218187/Car-Stereo",
    image: "Stereo",
  },
  BOSS: {
    link: "https://www.roblox.com/game-pass/4974038/Crime-Boss",
    image: "BOSS",
  },
  VIP: {
    link: "https://www.roblox.com/game-pass/2296901/Very-Important-Player-VIP",
    image: "VIP",
  },
  TradingVIP: {
    link: "https://www.roblox.com/game-pass/56149618/VIP-Trading",
    image: "TradingVIP",
  },
  Walmart: {
    link: "https://www.roblox.com/game-pass/1142100573/The-Pass",
    image: "Walmart",
  },
};

interface UserStatsSectionProps {
  currentData: InventoryData | null;
  currentSeason: Season | null;
  totalCashValue: number;
  totalDupedValue: number;
  isLoadingValues: boolean;
}

// Helper functions
const formatNumber = (num: number) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const formatMoney = (money: number) => {
  if (money >= 1000000000) {
    const value = Math.round(money / 100000000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}B`;
  } else if (money >= 1000000) {
    const value = Math.floor(money / 100000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`;
  } else if (money >= 1000) {
    const value = Math.floor(money / 100) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}K`;
  }
  return `$${money.toLocaleString()}`;
};

const formatPreciseMoney = (money: number) => {
  if (money >= 1000000000) {
    const value = Math.floor(money / 100000000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}B`;
  } else if (money >= 1000000) {
    const value = Math.floor(money / 100000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`;
  } else if (money >= 1000) {
    const value = Math.floor(money / 100) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}K`;
  }
  return `$${money.toLocaleString()}`;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = "/api/assets/images/placeholder.png";
};

const formatDate = (timestamp: number) => {
  return formatMessageDate(timestamp);
};

export default function UserStatsSection({
  currentData,
  currentSeason,
  totalCashValue,
  totalDupedValue,
  isLoadingValues,
}: UserStatsSectionProps) {
  const createdRelativeTime = useRealTimeRelativeDate(
    currentData?.created_at || 0,
  );
  const updatedRelativeTime = useRealTimeRelativeDate(
    currentData?.updated_at || 0,
  );

  if (!currentData) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="mb-2 h-4 w-1/3 rounded"></div>
          <div className="h-3 w-1/4 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Basic Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="text-center">
          <p className="text-secondary-text text-sm">Total Items</p>
          <Tooltip
            title={currentData.item_count.toLocaleString()}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",

                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <p className="text-primary-text cursor-help text-2xl font-bold">
              {formatNumber(currentData.item_count)}
            </p>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className="text-secondary-text text-sm">Original Items</p>
          <Tooltip
            title={currentData.data
              .filter((item) => item.isOriginalOwner)
              .length.toLocaleString()}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",

                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <p className="text-primary-text cursor-help text-2xl font-bold">
              {formatNumber(
                currentData.data.filter((item) => item.isOriginalOwner).length,
              )}
            </p>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className="text-secondary-text text-sm">Non-Original</p>
          <Tooltip
            title={currentData.data
              .filter((item) => !item.isOriginalOwner)
              .length.toLocaleString()}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",

                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <p className="text-primary-text cursor-help text-2xl font-bold">
              {formatNumber(
                currentData.data.filter((item) => !item.isOriginalOwner).length,
              )}
            </p>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className="text-secondary-text text-sm">Money</p>
          <Tooltip
            title={`$${currentData.money.toLocaleString()}`}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  backgroundColor: "var(--color-secondary-bg)",
                  color: "var(--color-primary-text)",
                  fontSize: "0.75rem",
                  padding: "8px 12px",
                  borderRadius: "8px",

                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  "& .MuiTooltip-arrow": {
                    color: "var(--color-secondary-bg)",
                  },
                },
              },
            }}
          >
            <p className="text-primary-text cursor-help text-2xl font-bold">
              {formatMoney(currentData.money)}
            </p>
          </Tooltip>
        </div>
      </div>

      {/* XP Progress Bar */}
      <XpProgressBar
        currentLevel={currentData.level}
        currentXp={currentData.xp}
        season={currentSeason}
      />

      {/* Total Values */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border-border-primary bg-secondary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-2 text-sm">
            Total Cash Value
          </div>
          {isLoadingValues ? (
            <div className="text-secondary-text animate-pulse text-2xl font-bold">
              Loading...
            </div>
          ) : (
            <Tooltip
              title={`$${totalCashValue.toLocaleString()}`}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <div className="text-primary-text cursor-help text-2xl font-bold">
                {formatPreciseMoney(totalCashValue)}
              </div>
            </Tooltip>
          )}
        </div>
        <div className="border-border-primary bg-secondary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-2 text-sm">
            Total Duped Value
          </div>
          {isLoadingValues ? (
            <div className="text-secondary-text animate-pulse text-2xl font-bold">
              Loading...
            </div>
          ) : (
            <Tooltip
              title={`$${totalDupedValue.toLocaleString()}`}
              placement="top"
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <div className="text-primary-text cursor-help text-2xl font-bold">
                {formatPreciseMoney(totalDupedValue)}
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Gamepasses */}
      {currentData.gamepasses && currentData.gamepasses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-primary-text mb-2 text-lg font-medium">
            Gamepasses
          </h3>
          <div className="flex flex-wrap gap-3">
            {(() => {
              const gamepassOrder = [
                "VIP",
                "PremiumGarage",
                "BOSS",
                "SWAT",
                "TradingVIP",
                "DuffelBag",
                "Stereo",
                "Walmart",
              ];

              // Get unique gamepasses and sort them according to the specified order
              const uniqueGamepasses = [...new Set(currentData.gamepasses)];
              const orderedGamepasses = gamepassOrder.filter((gamepass) =>
                uniqueGamepasses.includes(gamepass),
              );

              return orderedGamepasses.map((gamepass) => {
                const gamepassInfo =
                  gamepassData[gamepass as keyof typeof gamepassData];
                if (!gamepassInfo) return null;

                const GamepassContent = () => (
                  <div className="text-primary-text border-button-info hover:bg-button-info/10 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors">
                    <div className="relative h-6 w-6">
                      <Image
                        src={`/assets/images/gamepasses/${gamepassInfo.image}.webp`}
                        alt={gamepass}
                        width={24}
                        height={24}
                        className="object-contain"
                        onError={handleImageError}
                      />
                    </div>
                    <span>{gamepass}</span>
                  </div>
                );

                return gamepassInfo.link ? (
                  <a
                    key={gamepass}
                    href={gamepassInfo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <GamepassContent />
                  </a>
                ) : (
                  <div key={gamepass}>
                    <GamepassContent />
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-secondary-text mt-4 space-y-1 text-sm">
        <p>
          <span className="text-primary-text font-semibold">Scan Count:</span>{" "}
          <span className="text-secondary-text">{currentData.scan_count}</span>
        </p>
        <p>
          <span className="text-primary-text font-semibold">
            First Scanned:
          </span>{" "}
          <span className="text-secondary-text">
            {formatDate(currentData.created_at)} ({createdRelativeTime})
          </span>
        </p>
        <p>
          <span className="text-primary-text font-semibold">Last Scanned:</span>{" "}
          <span className="text-secondary-text">
            {formatDate(currentData.updated_at)} ({updatedRelativeTime})
          </span>
        </p>
      </div>
    </div>
  );
}
