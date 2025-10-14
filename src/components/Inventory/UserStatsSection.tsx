"use client";

import React, { useState } from "react";
import { Season } from "@/types/seasons";
import { InventoryData } from "@/app/inventories/types";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/timestamp";
import XpProgressBar from "./XpProgressBar";
import dynamic from "next/dynamic";
import Image from "next/image";
import ScanHistoryModal from "../Modals/ScanHistoryModal";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
const gamepassData = {
  PremiumGarage: {
    link: "https://www.roblox.com/game-pass/2725211/Pro-Garage",
    image: "PremiumGarage",
    displayName: "Pro Garage",
  },
  DuffelBag: {
    link: "https://www.roblox.com/game-pass/2219040/Duffel-Bag",
    image: "DuffelBag",
    displayName: "Bigger Duffel Bag",
  },
  SWAT: {
    link: "https://www.roblox.com/game-pass/2070427/SWAT-Team",
    image: "SWAT",
    displayName: "SWAT",
  },
  Stereo: {
    link: "https://www.roblox.com/game-pass/2218187/Car-Stereo",
    image: "Stereo",
    displayName: "Car Stereo",
  },
  BOSS: {
    link: "https://www.roblox.com/game-pass/4974038/Crime-Boss",
    image: "BOSS",
    displayName: "Crime BOSS",
  },
  VIP: {
    link: "https://www.roblox.com/game-pass/2296901/Very-Important-Player-VIP",
    image: "VIP",
    displayName: "Very Important Player [VIP]",
  },
  TradingVIP: {
    link: "https://www.roblox.com/game-pass/56149618/VIP-Trading",
    image: "TradingVIP",
    displayName: "VIP Trading",
  },
  Walmart: {
    link: "https://www.roblox.com/game-pass/1142100573/The-Pass",
    image: "Walmart",
    displayName: "Walmart",
  },
  Stash: {
    link: "https://www.roblox.com/game-pass/2068240/Extra-Storage-Retiring-Soon",
    image: "Stash",
    displayName: "Extra Storage",
  },
};

interface UserStatsSectionProps {
  currentData: InventoryData | null;
  currentSeason: Season | null;
  totalCashValue: number;
  isLoadingValues: boolean;
  userId: string;
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
  e.currentTarget.src =
    "https://assets.jailbreakchangelogs.xyz/assets/images/placeholder.png";
};

const formatDate = (timestamp: number) => {
  return formatMessageDate(timestamp);
};

export default function UserStatsSection({
  currentData,
  currentSeason,
  totalCashValue,
  isLoadingValues,
  userId,
}: UserStatsSectionProps) {
  const [isScanHistoryModalOpen, setIsScanHistoryModalOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<
    Array<{ scan_id: string; created_at: number }>
  >([]);
  const [isLoadingScanHistory, setIsLoadingScanHistory] = useState(false);
  const createdRelativeTime = useRealTimeRelativeDate(
    currentData?.created_at || 0,
  );
  const updatedRelativeTime = useRealTimeRelativeDate(
    currentData?.updated_at || 0,
  );

  const fetchScanHistory = async () => {
    setIsLoadingScanHistory(true);
    try {
      const response = await fetch(
        `/api/inventories/scan-history?id=${userId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch scan history");
      }
      const data = await response.json();
      setScanHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching scan history:", error);
      setScanHistory([]);
    } finally {
      setIsLoadingScanHistory(false);
    }
  };

  const handleOpenScanHistory = () => {
    setIsScanHistoryModalOpen(true);
    if (scanHistory.length === 0) {
      fetchScanHistory();
    }
  };

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
      <div className="mt-4">
        <div className="border-border-primary bg-primary-bg rounded-lg border p-4 text-center">
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
      </div>

      {/* Gamepasses */}
      {currentData.gamepasses && currentData.gamepasses.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-primary-text text-sm font-medium">
              Owned Passes ({currentData.gamepasses.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
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
                "Stash",
              ];

              const uniqueGamepasses = [...new Set(currentData.gamepasses)];
              const orderedGamepasses = gamepassOrder.filter((gamepass) =>
                uniqueGamepasses.includes(gamepass),
              );

              return orderedGamepasses.map((gamepass) => {
                const gamepassInfo =
                  gamepassData[gamepass as keyof typeof gamepassData];
                if (!gamepassInfo) return null;

                const GamepassContent = () => (
                  <div className="group border-border-primary bg-primary-bg hover:border-primary/50 hover:bg-primary/5 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200">
                    <div className="relative h-8 w-8 flex-shrink-0">
                      <Image
                        src={`https://assets.jailbreakchangelogs.xyz/assets/images/gamepasses/${gamepassInfo.image}.webp`}
                        alt={gamepass}
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                        onError={handleImageError}
                      />
                    </div>
                    <span className="text-primary-text group-hover:text-primary text-sm font-medium transition-colors">
                      {gamepassInfo.displayName}
                    </span>
                    {gamepassInfo.link && (
                      <svg
                        className="text-secondary-text h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
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

      {/* View Scan History Button */}
      <div className="mt-4">
        <button
          onClick={handleOpenScanHistory}
          disabled={isLoadingScanHistory}
          className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoadingScanHistory ? "Loading..." : "View Scan History"}
        </button>
      </div>

      {/* Scan History Modal */}
      <ScanHistoryModal
        isOpen={isScanHistoryModalOpen}
        onClose={() => setIsScanHistoryModalOpen(false)}
        initialScanHistory={scanHistory}
      />
    </div>
  );
}
