"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Season } from "@/types/seasons";
import { InventoryData } from "@/app/inventories/types";
import { RobloxUser } from "@/types";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/timestamp";
import { useRobloxUserDataQuery } from "@/hooks/useRobloxDataQuery";
import { INVENTORY_API_URL } from "@/utils/api";
import XpProgressBar from "./XpProgressBar";
import Image from "next/image";
import ScanHistoryModal from "../Modals/ScanHistoryModal";
import { Icon } from "../ui/IconWrapper";
import { Switch } from "../ui/switch";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
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
  totalNetworth: number;
  totalDupedValue: number;
  nonOgStats?: {
    inventoryValue: number;
    networth: number;
    dupedValue: number;
    itemCount: number;
    dupedItemCount: number;
  };
  showNonOgOnly: boolean;
  setShowNonOgOnly: (val: boolean) => void;
  isLoadingValues: boolean;
  userId: string;
  hasDupedValue?: boolean;
  totalItemsCount: number;
  duplicatesCount?: number;
  robloxUsers?: Record<string, RobloxUser>;
}

// Helper functions
const formatNumber = (num: number) => {
  if (num >= 1000000000) {
    const value = Math.floor(num / 100000000) / 10;
    return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + "B";
  }
  if (num >= 1000000) {
    const value = Math.floor(num / 100000) / 10;
    return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + "M";
  }
  if (num >= 10000) {
    const value = Math.floor(num / 100) / 10;
    return (value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)) + "K";
  }
  return num.toLocaleString();
};

const formatMoney = (money: number) => {
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
  e.currentTarget.src = "/assets/images/Placeholder.webp";
};

const formatDate = (timestamp: number) => {
  return formatMessageDate(timestamp);
};

export default function UserStatsSection({
  currentData,
  currentSeason,
  totalCashValue,
  totalNetworth,
  totalDupedValue,
  nonOgStats,
  showNonOgOnly,
  setShowNonOgOnly,
  isLoadingValues,
  userId,
  hasDupedValue = false,
  totalItemsCount,
  duplicatesCount,
  robloxUsers,
}: UserStatsSectionProps) {
  const [isScanHistoryModalOpen, setIsScanHistoryModalOpen] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [scanHistory, setScanHistory] = useState<
    Array<{ scan_id: string; created_at: number }>
  >([]);
  const [isLoadingScanHistory, setIsLoadingScanHistory] = useState(false);
  const [queuePosition, setQueuePosition] = useState<{
    position: number;
    delay: number;
  } | null>(null);
  const [isLoadingQueuePosition, setIsLoadingQueuePosition] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const hasFetchedQueuePosition = useRef(false);
  const createdRelativeTime = useRealTimeRelativeDate(
    currentData?.created_at || 0,
  );
  const updatedRelativeTime = useRealTimeRelativeDate(
    currentData?.updated_at || 0,
  );

  // Fetch bot user data if needed
  const { data: botRobloxData } = useRobloxUserDataQuery(
    currentData?.bot_id || null,
  );

  // Determine bot user (check props first, then fetched data)
  const botUser = currentData?.bot_id
    ? robloxUsers?.[currentData.bot_id] ||
      botRobloxData?.usersData?.[currentData.bot_id] ||
      null
    : null;

  const fetchScanHistory = async () => {
    setIsLoadingScanHistory(true);
    try {
      const response = await fetch(
        `/api/inventories/scan-history?id=${encodeURIComponent(userId)}`,
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

  const fetchQueuePosition = useCallback(async () => {
    if (!INVENTORY_API_URL || !userId) return;

    setIsLoadingQueuePosition(true);
    setQueueError(null);
    try {
      const response = await fetch(
        `/api/inventories/queue/position?id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      if (response.status === 404) {
        const data = await response.json();
        setQueueError(data.error || "User not found in queue");
        setQueuePosition(null);
      } else if (response.ok) {
        const data = await response.json();
        setQueuePosition({
          position: data.position,
          delay: data.delay,
        });
        setQueueError(null);
      } else {
        throw new Error(`Failed to fetch queue position: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching queue position:", error);
      setQueueError("Failed to fetch queue position");
      setQueuePosition(null);
    } finally {
      setIsLoadingQueuePosition(false);
    }
  }, [userId]);

  // Fetch queue position when metadata dropdown opens
  useEffect(() => {
    if (isMetadataExpanded && !hasFetchedQueuePosition.current) {
      hasFetchedQueuePosition.current = true;
      fetchQueuePosition();
    }
    // Reset the ref when dropdown closes so it can fetch again next time
    if (!isMetadataExpanded) {
      hasFetchedQueuePosition.current = false;
    }
  }, [isMetadataExpanded, fetchQueuePosition]);

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
      {/* Non-OG Toggle */}
      {nonOgStats && (
        <div className="flex items-center justify-end gap-2">
          <label
            className="text-secondary-text cursor-pointer text-sm font-medium select-none"
            htmlFor="non-og-toggle"
          >
            Only Non-OG
          </label>
          <Switch
            id="non-og-toggle"
            checked={showNonOgOnly}
            onCheckedChange={(checked) => {
              const newValue = checked;
              setShowNonOgOnly(newValue);
              window.umami?.track("Inventory UserStats Non-OG Toggle", {
                active: newValue,
              });
            }}
          />
        </div>
      )}

      {/* Basic Stats */}
      <div
        className={`grid grid-cols-2 gap-4 ${(currentData.dupe_count ?? 0) > 0 ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"}`}
      >
        <div className="text-center">
          <p className="text-secondary-text text-sm">Total Items</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-primary-text cursor-help text-2xl font-bold">
                {formatNumber(
                  showNonOgOnly ? nonOgStats?.itemCount || 0 : totalItemsCount,
                )}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">
              Total items:{" "}
              {(
                (showNonOgOnly ? nonOgStats?.itemCount : totalItemsCount) || 0
              ).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className="text-secondary-text text-sm">Original Items</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-primary-text cursor-help text-2xl font-bold">
                {showNonOgOnly
                  ? "0"
                  : formatNumber(
                      currentData.data.filter((item) => item.isOriginalOwner)
                        .length +
                        (currentData.duplicates || []).filter(
                          (item) => item.isOriginalOwner,
                        ).length,
                    )}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">
              Original items:{" "}
              {showNonOgOnly
                ? "0"
                : (() => {
                    const regularOriginal = currentData.data.filter(
                      (item) => item.isOriginalOwner,
                    ).length;
                    const dupeOriginal = (currentData.duplicates || []).filter(
                      (item) => item.isOriginalOwner,
                    ).length;
                    return (regularOriginal + dupeOriginal).toLocaleString();
                  })()}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className="text-secondary-text text-sm">Non-Original</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-primary-text cursor-help text-2xl font-bold">
                {formatNumber(
                  currentData.data.filter((item) => !item.isOriginalOwner)
                    .length +
                    (currentData.duplicates || []).filter(
                      (item) => !item.isOriginalOwner,
                    ).length,
                )}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">
              Non-original items:{" "}
              {(() => {
                const regularNonOriginal = currentData.data.filter(
                  (item) => !item.isOriginalOwner,
                ).length;
                const dupeNonOriginal = (currentData.duplicates || []).filter(
                  (item) => !item.isOriginalOwner,
                ).length;
                return (regularNonOriginal + dupeNonOriginal).toLocaleString();
              })()}
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Total Duped Items - Only show if duplicatesCount > 0 */}
        {duplicatesCount !== undefined && duplicatesCount > 0 && (
          <div className="text-center">
            <p className="text-secondary-text text-sm">Duped Items</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-primary-text cursor-help text-2xl font-bold">
                  {formatNumber(
                    showNonOgOnly
                      ? nonOgStats?.dupedItemCount || 0
                      : duplicatesCount,
                  )}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top">
                Duped items:{" "}
                {(showNonOgOnly
                  ? nonOgStats?.dupedItemCount || 0
                  : duplicatesCount
                ).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        <div className="text-center">
          <p className="text-secondary-text text-sm">Money</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-primary-text cursor-help text-2xl font-bold">
                {formatMoney(currentData.money)}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">
              Money: ${currentData.money.toLocaleString()}
            </TooltipContent>
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
      <div
        className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${(currentData.duplicates?.length ?? 0) > 0 ? "lg:grid-cols-3" : ""}`}
      >
        {/* Inventory Value */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-2 flex items-center justify-center gap-1.5 text-sm">
            {showNonOgOnly ? "Non-OG Inventory Value" : "Total Inventory Value"}
            <Tooltip>
              <TooltipTrigger asChild>
                <Icon
                  icon="material-symbols:info-outline"
                  className="text-secondary-text h-4 w-4 cursor-help"
                  inline={true}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-secondary-bg text-primary-text max-w-[250px] border-none shadow-[var(--color-card-shadow)]"
              >
                <p>
                  {showNonOgOnly
                    ? "Only counts clean non-OG items' cash value."
                    : "Only counts clean items' cash value. Does not include cash value of duped items."}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isLoadingValues ? (
            <div className="text-secondary-text animate-pulse text-2xl font-bold">
              Loading...
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-primary-text cursor-help text-2xl font-bold">
                  {formatPreciseMoney(
                    showNonOgOnly
                      ? nonOgStats?.inventoryValue || 0
                      : totalCashValue,
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {showNonOgOnly
                  ? "Non-OG inventory value"
                  : "Total inventory value"}
                : $
                {(showNonOgOnly
                  ? nonOgStats?.inventoryValue || 0
                  : totalCashValue
                ).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Total Networth */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-2 flex items-center justify-center gap-1.5 text-sm">
            {showNonOgOnly ? "Non-OG Networth" : "Total Networth"}
            <Tooltip>
              <TooltipTrigger asChild>
                <Icon
                  icon="material-symbols:info-outline"
                  className="text-secondary-text h-4 w-4 cursor-help"
                  inline={true}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-secondary-bg text-primary-text max-w-[250px] border-none shadow-[var(--color-card-shadow)]"
              >
                <p>
                  {showNonOgOnly
                    ? "Includes cash value of all non-OG items and your cash."
                    : "Includes total cash value of all items, including duped items' cash value."}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isLoadingValues ? (
            <div className="text-secondary-text animate-pulse text-2xl font-bold">
              Loading...
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-primary-text cursor-help text-2xl font-bold">
                  {formatPreciseMoney(
                    showNonOgOnly ? nonOgStats?.networth || 0 : totalNetworth,
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {showNonOgOnly ? "Non-OG networth" : "Total networth"}: $
                {(showNonOgOnly
                  ? nonOgStats?.networth || 0
                  : totalNetworth
                ).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Total Duped Value - Only show if user has duplicates or backend has duped value */}
        {(hasDupedValue ||
          (currentData &&
            currentData.duplicates &&
            currentData.duplicates.length > 0)) && (
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <div className="text-secondary-text mb-2 flex items-center justify-center gap-1.5 text-sm">
              {showNonOgOnly ? "Non-OG Duped Value" : "Total Duped Value"}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon
                    icon="material-symbols:info-outline"
                    className="text-secondary-text h-4 w-4 cursor-help"
                    inline={true}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-secondary-bg text-primary-text max-w-[250px] border-none shadow-[var(--color-card-shadow)]"
                >
                  <p>
                    {showNonOgOnly
                      ? "Collective duped value of all non-OG duped items in your inventory."
                      : "Collective duped value of all duped items in your inventory."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {isLoadingValues ? (
              <div className="text-secondary-text animate-pulse text-2xl font-bold">
                Loading...
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-primary-text cursor-help text-2xl font-bold">
                    {formatPreciseMoney(
                      showNonOgOnly
                        ? nonOgStats?.dupedValue || 0
                        : totalDupedValue,
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {showNonOgOnly ? "Non-OG duped value" : "Total duped value"}:
                  {" $"}
                  {(showNonOgOnly
                    ? nonOgStats?.dupedValue || 0
                    : totalDupedValue
                  ).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Gamepasses */}
      {currentData.gamepasses && currentData.gamepasses.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-primary-text text-sm font-medium">
              Owned Gamepasses ({currentData.gamepasses.length})
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
                  <div className="group border-border-card bg-tertiary-bg flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-200">
                    <div className="relative h-8 w-8 shrink-0">
                      <Image
                        src={`https://assets.jailbreakchangelogs.xyz/assets/images/gamepasses/${gamepassInfo.image}.webp`}
                        alt={gamepass}
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                        onError={handleImageError}
                      />
                    </div>
                    <span className="text-primary-text group-hover:text-link text-sm font-medium transition-colors">
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

      {/* Collapsible Metadata Section */}
      <div className="border-border-card bg-tertiary-bg overflow-hidden rounded-lg border text-sm">
        <button
          onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors"
        >
          <span className="text-primary-text font-medium">Scan Metadata</span>
          <Icon
            icon="material-symbols:keyboard-arrow-down"
            className={`text-secondary-text h-5 w-5 transition-transform duration-200 ${
              isMetadataExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
            isMetadataExpanded ? "max-h-[500px]" : "max-h-0"
          }`}
        >
          <div className="border-border-card border-t px-4 py-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="text-secondary-text min-w-[100px]">
                  Scan Count:
                </span>
                <span className="text-primary-text font-medium">
                  {currentData.scan_count}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-secondary-text min-w-[100px]">
                  First Scanned:
                </span>
                <span className="text-primary-text font-medium">
                  {formatDate(currentData.created_at)}
                  <span className="text-secondary-text ml-1 text-xs">
                    ({createdRelativeTime})
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-secondary-text min-w-[100px]">
                  Last Scanned:
                </span>
                <span className="text-primary-text font-medium">
                  {formatDate(currentData.updated_at)}
                  <span className="text-secondary-text ml-1 text-xs">
                    ({updatedRelativeTime})
                  </span>
                </span>
              </div>

              {/* Bot Info */}
              {currentData.bot_id && (
                <div className="flex items-center gap-2">
                  <span className="text-secondary-text min-w-[100px]">
                    Scanned By:
                  </span>
                  <div className="flex items-center gap-2">
                    {botUser ? (
                      <>
                        <div className="h-6 w-6 overflow-hidden rounded-full bg-gray-200">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${botUser.id}/avatar-headshot`}
                            alt={
                              botUser.name ||
                              botUser.displayName ||
                              `Bot ${botUser.id} avatar`
                            }
                            width={24}
                            height={24}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                "/assets/images/Placeholder.webp";
                            }}
                          />
                        </div>
                        <a
                          href={`https://www.roblox.com/users/${botUser.id}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-text hover:text-link font-medium transition-colors"
                        >
                          {botUser.name || botUser.displayName}
                        </a>
                      </>
                    ) : (
                      <a
                        href={`https://www.roblox.com/users/${currentData.bot_id}/profile`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-text hover:text-link font-medium transition-colors"
                      >
                        Bot {currentData.bot_id}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Job ID */}
              {currentData.job_id && (
                <div className="flex gap-2">
                  <span className="text-secondary-text min-w-[100px]">
                    Job ID:
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://tracker.jailbreakchangelogs.xyz/?jobid=${currentData.job_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-text hover:text-link max-w-[200px] cursor-pointer truncate font-mono text-xs font-medium transition-colors md:max-w-full"
                      >
                        {currentData.job_id}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
                    >
                      <p>{currentData.job_id}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Queue Position */}
              <div className="flex items-center gap-2">
                <span className="text-secondary-text min-w-[100px]">
                  Queue Position:
                </span>
                <div className="text-primary-text flex items-center gap-2 font-medium">
                  {isLoadingQueuePosition ? (
                    <span className="text-secondary-text text-xs">
                      Loading...
                    </span>
                  ) : queueError ? (
                    <span className="text-secondary-text text-xs">
                      Not in queue
                    </span>
                  ) : queuePosition ? (
                    <span className="text-xs">
                      #{queuePosition.position.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-secondary-text text-xs">
                      Not in queue
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => fetchQueuePosition()}
                        disabled={isLoadingQueuePosition}
                        className="text-secondary-text hover:text-primary-text cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        <Icon
                          icon="material-symbols:refresh"
                          className={`h-4 w-4 ${isLoadingQueuePosition ? "animate-spin" : ""}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
                    >
                      <p>Refresh position</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* View Scan History Button */}
              <div className="pt-2">
                <button
                  onClick={handleOpenScanHistory}
                  disabled={isLoadingScanHistory}
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingScanHistory ? "Loading..." : "View Scan History"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
