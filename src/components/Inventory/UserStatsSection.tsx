"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Season } from "@/types/seasons";
import { InventoryData } from "@/app/inventories/types";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { formatMessageDate } from "@/utils/helpers/timestamp";
import { INVENTORY_API_URL } from "@/utils/api/api";
import XpProgressBar from "./XpProgressBar";
import Image from "next/image";
import ScanHistoryModal from "../Modals/ScanHistoryModal";
import { Icon } from "../ui/IconWrapper";
import { Button } from "../ui/button";
import { Spinner } from "../ui/Spinner";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { createLogger } from "@/services/logger";

const log = createLogger("UI");
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
  seasonRateLimitMessage?: string;
  totalCashValue: number;
  totalNetworth: number;
  totalDupedValue: number;
  activeFilteredStats?: {
    inventoryValue: number;
    networth: number;
    dupedValue: number;
    itemCount: number;
    dupedItemCount: number;
  } | null;
  filterLabel: string;
  showOnlyNonOriginal: boolean;
  isLoadingValues: boolean;
  userId: string;
  hasDupedValue?: boolean;
  totalItemsCount: number;
  duplicatesCount?: number;
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
  seasonRateLimitMessage,
  totalCashValue,
  totalNetworth,
  totalDupedValue,
  activeFilteredStats,
  filterLabel,
  showOnlyNonOriginal,
  isLoadingValues,
  userId,
  hasDupedValue = false,
  totalItemsCount,
  duplicatesCount,
}: UserStatsSectionProps) {
  const { user, isAuthenticated } = useAuthContext();
  const isOwnInventory =
    isAuthenticated && Boolean(user?.roblox_id) && user?.roblox_id === userId;
  const [isScanHistoryModalOpen, setIsScanHistoryModalOpen] = useState(false);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(true);
  const createdRelativeTime = useRealTimeRelativeDate(
    currentData?.created_at || 0,
  );
  const updatedRelativeTime = useRealTimeRelativeDate(
    currentData?.updated_at || 0,
  );
  const tradeNote = (currentData?.trade_note?.note || "").trim();

  const scanHistoryQuery = useQuery({
    queryKey: ["inventory-scan-history", userId],
    enabled: isScanHistoryModalOpen,
    queryFn: async ({
      signal,
    }): Promise<Array<{ scan_id: string; created_at: number }>> => {
      const response = await fetch(
        `/api/inventories/scan-history?id=${encodeURIComponent(userId)}`,
        { signal },
      );
      if (!response.ok) throw new Error("Failed to fetch scan history");
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const scanHistory = scanHistoryQuery.data ?? [];
  const isLoadingScanHistory = scanHistoryQuery.isLoading;
  const handleOpenScanHistory = () => {
    setIsScanHistoryModalOpen(true);
    if (scanHistoryQuery.isError || scanHistoryQuery.data?.length === 0)
      void scanHistoryQuery.refetch();
  };
  const queueQuery = useQuery({
    queryKey: ["inventory-queue-position", userId],
    enabled: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/inventories/queue/position?id=${encodeURIComponent(userId)}`,
        { cache: "no-store", signal },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 404)
        throw new Error("Failed to fetch queue position");
      return { status: response.status, data };
    },
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const queueData = queueQuery.data?.data;
  const queuePosition =
    !queueQuery.isError &&
    queueQuery.data?.status !== 404 &&
    typeof queueData?.position === "number" &&
    Number.isFinite(queueData.position) &&
    typeof queueData?.delay === "number" &&
    Number.isFinite(queueData.delay)
      ? { position: queueData.position, delay: queueData.delay }
      : null;
  const isLoadingQueuePosition = queueQuery.isFetching;
  const hasCheckedQueuePosition = queueQuery.isFetched || queueQuery.isFetching;
  const queueError = queueQuery.isError
    ? "Failed to fetch queue position"
    : queueQuery.data && !queuePosition
      ? queueData?.error || "User not found in queue"
      : null;
  const refetchQueue = queueQuery.refetch;
  const fetchQueuePosition = useCallback(async () => {
    if (INVENTORY_API_URL && userId) await refetchQueue();
  }, [userId, refetchQueue]);
  useEffect(() => {
    if (scanHistoryQuery.error)
      log.error("Error fetching scan history:", scanHistoryQuery.error);
    if (queueQuery.error)
      log.error("Error fetching queue position:", queueQuery.error);
  }, [scanHistoryQuery.error, queueQuery.error]);

  const handleCopyTradeNote = async () => {
    try {
      if (!tradeNote) return;
      await navigator.clipboard.writeText(tradeNote);
      toast.success("Trade note copied to clipboard!", { duration: 3000 });
    } catch (err) {
      log.error("Failed to copy trade note", err);
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
      <div
        className={`grid grid-cols-2 gap-4 ${(currentData.dupe_count ?? 0) > 0 ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-4"}`}
      >
        <div className="text-center">
          <p className="text-secondary-text text-sm">
            {activeFilteredStats ? `${filterLabel} Items` : "Total Items"}
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-primary-text cursor-help text-2xl font-bold">
                {formatNumber(
                  activeFilteredStats
                    ? activeFilteredStats.itemCount
                    : totalItemsCount,
                )}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">
              {activeFilteredStats ? `${filterLabel} items` : "Total items"}:{" "}
              {(activeFilteredStats
                ? activeFilteredStats.itemCount
                : totalItemsCount
              ).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center">
          <p className="text-secondary-text text-sm">Original Items</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-primary-text cursor-help text-2xl font-bold">
                {formatNumber(
                  showOnlyNonOriginal
                    ? 0
                    : currentData.data.filter((item) => item.isOriginalOwner)
                        .length +
                        (currentData.duplicates || []).filter(
                          (item) => item.isOriginalOwner,
                        ).length,
                )}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top">
              Original items:{" "}
              {showOnlyNonOriginal
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
                    activeFilteredStats
                      ? activeFilteredStats.dupedItemCount
                      : duplicatesCount,
                  )}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top">
                Duped items:{" "}
                {(activeFilteredStats
                  ? activeFilteredStats.dupedItemCount
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
        bgStyle="tertiary"
        seasonRateLimitMessage={seasonRateLimitMessage}
      />

      {/* Total Values */}
      <div
        className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${(currentData.duplicates?.length ?? 0) > 0 ? "lg:grid-cols-3" : ""}`}
      >
        {/* Inventory Value */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-2 flex items-center justify-center gap-1.5 text-sm">
            {activeFilteredStats
              ? `${filterLabel} Clean Inventory Value`
              : "Clean Inventory Value"}
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
                className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
              >
                <p>
                  {activeFilteredStats
                    ? `Only counts clean ${filterLabel} items' cash value.`
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
                    activeFilteredStats
                      ? activeFilteredStats.inventoryValue
                      : totalCashValue,
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {activeFilteredStats
                  ? `${filterLabel} clean inventory value`
                  : "Clean inventory value"}
                : $
                {(activeFilteredStats
                  ? activeFilteredStats.inventoryValue
                  : totalCashValue
                ).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Total Networth */}
        <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
          <div className="text-secondary-text mb-2 flex items-center justify-center gap-1.5 text-sm">
            {activeFilteredStats ? `${filterLabel} Networth` : "Total Networth"}
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
                className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
              >
                <p>
                  {activeFilteredStats
                    ? `Clean ${filterLabel} item value plus duped ${filterLabel} item value${showOnlyNonOriginal ? " and money" : ""}. Duped items use their clean value when no duped value is available.`
                    : "Clean inventory value plus duped item value and money. Duped items use their clean value when no duped value is available."}
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
                    activeFilteredStats
                      ? activeFilteredStats.networth
                      : totalNetworth,
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {activeFilteredStats
                  ? `${filterLabel} networth`
                  : "Total networth"}
                : $
                {(activeFilteredStats
                  ? activeFilteredStats.networth
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
              {activeFilteredStats
                ? `${filterLabel} Duped Value`
                : "Total Duped Value"}
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
                  className="bg-secondary-bg text-primary-text max-w-62.5 border-none shadow-(--color-card-shadow)"
                >
                  <p>
                    {activeFilteredStats
                      ? `Combined value of all duped ${filterLabel} items. Uses clean value when no duped value is available.`
                      : "Combined value of all duped items in your inventory. Uses clean value when no duped value is available."}
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
                      activeFilteredStats
                        ? activeFilteredStats.dupedValue
                        : totalDupedValue,
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {activeFilteredStats
                    ? `${filterLabel} duped value`
                    : "Total duped value"}
                  :{" $"}
                  {(activeFilteredStats
                    ? activeFilteredStats.dupedValue
                    : totalDupedValue
                  ).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {(() => {
        const gamepasses = Array.isArray(currentData.gamepasses)
          ? currentData.gamepasses
          : [];
        const hasGamepasses = gamepasses.length > 0;
        const GamepassesBlock = hasGamepasses ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-primary-text text-sm font-medium">
                Owned Gamepasses ({gamepasses.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-2 min-[320px]:grid-cols-2 sm:flex sm:flex-wrap">
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

                const uniqueGamepasses = [...new Set(gamepasses)];
                const orderedGamepasses = gamepassOrder.filter((gamepass) =>
                  uniqueGamepasses.includes(gamepass),
                );

                return orderedGamepasses.map((gamepass) => {
                  const gamepassInfo =
                    gamepassData[gamepass as keyof typeof gamepassData];
                  if (!gamepassInfo) return null;

                  const gamepassContent = (
                    <div className="group border-border-card bg-tertiary-bg flex h-full min-h-11 items-center gap-2 rounded-lg border px-2 py-2 text-sm transition-all duration-200 sm:gap-3 sm:px-3">
                      <div className="relative h-7 w-7 shrink-0 sm:h-8 sm:w-8">
                        <Image
                          src={`https://assets.jailbreakchangelogs.com/assets/images/gamepasses/${gamepassInfo.image}.webp`}
                          alt={gamepass}
                          width={32}
                          height={32}
                          className="h-full w-full object-contain"
                          onError={handleImageError}
                        />
                      </div>
                      <span className="text-primary-text group-hover:text-link min-w-0 text-xs leading-tight font-medium transition-colors sm:text-sm">
                        {gamepassInfo.displayName}
                      </span>
                      {gamepassInfo.link && (
                        <svg
                          className="text-secondary-text hidden h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 sm:block"
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
                      className="block h-full"
                    >
                      {gamepassContent}
                    </a>
                  ) : (
                    <div key={gamepass}>{gamepassContent}</div>
                  );
                });
              })()}
            </div>
          </div>
        ) : null;

        const TradeNoteBlock = tradeNote ? (
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-primary-text text-sm font-medium">
                  Last Trade Note
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Icon
                        icon="material-symbols:info-outline"
                        className="text-secondary-text h-4 w-4 cursor-help"
                        inline={true}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-secondary-bg text-primary-text max-w-65 border-none shadow-(--color-card-shadow)"
                  >
                    <p>
                      This note comes from the user&apos;s last inventory scan.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <p className="text-primary-text text-sm wrap-break-word whitespace-pre-wrap italic">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="group cursor-pointer transition-opacity select-none hover:opacity-80"
                    onClick={handleCopyTradeNote}
                  >
                    &quot;{tradeNote}&quot;
                    <Icon
                      icon="heroicons-outline:clipboard"
                      className="text-secondary-text ml-1.5 inline h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                      inline={true}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
                >
                  <p>Click to copy</p>
                </TooltipContent>
              </Tooltip>
            </p>
          </div>
        ) : null;

        const ScanMetadataBlock = (
          <div className="border-border-card bg-tertiary-bg overflow-hidden rounded-lg border text-sm">
            <button
              onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors"
            >
              <span className="text-primary-text font-medium">
                Scan Metadata
              </span>
              <Icon
                icon="material-symbols:keyboard-arrow-down"
                className={`text-secondary-text h-5 w-5 transition-transform duration-200 ${
                  isMetadataExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                isMetadataExpanded ? "max-h-125" : "max-h-0"
              }`}
            >
              <div className="border-border-card border-t px-4 py-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-secondary-text">Scan Count:</span>
                    <span className="text-primary-text font-medium">
                      {currentData.scan_count}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-secondary-text">
                      First scanned on:
                    </span>
                    <span className="text-primary-text font-medium">
                      {formatDate(currentData.created_at)}
                      <span className="text-secondary-text ml-1 text-xs">
                        ({createdRelativeTime})
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-secondary-text">
                      Last scanned on:
                    </span>
                    <span className="text-primary-text font-medium">
                      {formatDate(currentData.updated_at)}
                      <span className="text-secondary-text ml-1 text-xs">
                        ({updatedRelativeTime})
                      </span>
                    </span>
                  </div>

                  {/* Queue Position */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-secondary-text">Queue Position:</span>
                    <div className="text-primary-text flex flex-wrap items-center gap-2 font-medium">
                      {!hasCheckedQueuePosition ? (
                        <span className="text-secondary-text text-xs">
                          Not checked yet
                        </span>
                      ) : isLoadingQueuePosition ? (
                        <span className="text-secondary-text text-xs">
                          Loading...
                        </span>
                      ) : queueError ? (
                        <span className="text-secondary-text text-xs">
                          Not in scan queue
                        </span>
                      ) : queuePosition ? (
                        <span className="text-xs">
                          #{queuePosition.position.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-secondary-text text-xs">
                          Not in scan queue
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => fetchQueuePosition()}
                        disabled={isLoadingQueuePosition}
                        className="text-link inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-xs font-medium hover:underline disabled:opacity-50"
                      >
                        {isLoadingQueuePosition ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <Icon
                            icon="material-symbols:refresh"
                            className="h-4 w-4"
                          />
                        )}
                        Check queue position
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={handleOpenScanHistory}
                      disabled={isLoadingScanHistory}
                      size="sm"
                    >
                      {isLoadingScanHistory
                        ? "Loading..."
                        : "View Scan History"}
                    </Button>
                    {isOwnInventory && (
                      <Button asChild variant="secondary" size="sm">
                        <Link href="/settings?highlight=inventory-data-deletion">
                          <Icon
                            icon="heroicons:trash"
                            className="text-button-danger h-4 w-4"
                          />
                          Delete inventory data
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

        if (hasGamepasses) {
          return (
            <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
              <div className="space-y-4">
                {GamepassesBlock}
                {TradeNoteBlock}
              </div>
              {ScanMetadataBlock}
            </div>
          );
        }

        if (TradeNoteBlock) {
          return (
            <div className="mt-4 space-y-4">
              {TradeNoteBlock}
              {ScanMetadataBlock}
            </div>
          );
        }

        return <div className="mt-4">{ScanMetadataBlock}</div>;
      })()}

      {/* Scan History Modal */}
      <ScanHistoryModal
        isOpen={isScanHistoryModalOpen}
        onClose={() => setIsScanHistoryModalOpen(false)}
        isLoading={isLoadingScanHistory}
        initialScanHistory={scanHistory}
      />
    </div>
  );
}
