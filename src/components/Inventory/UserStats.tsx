"use client";

import Image from "next/image";
import Link from "next/link";
import { RobloxUser, Item } from "@/types";
import { Season } from "@/types/seasons";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { useEffect, useState } from "react";
import { useRealTimeRelativeDate } from "@/hooks/useRealTimeRelativeDate";
import { useAuthContext } from "@/contexts/AuthContext";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { UserConnectionData } from "@/app/inventories/types";
import toast from "react-hot-toast";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";
import XpProgressBar from "./XpProgressBar";

// Helper function to parse cash value strings for totals (returns 0 for N/A)
const parseCashValueForTotal = (value: string | null): number => {
  if (value === null || value === "N/A") return 0;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (value.toLowerCase().includes("k")) return num * 1000;
  if (value.toLowerCase().includes("m")) return num * 1000000;
  if (value.toLowerCase().includes("b")) return num * 1000000000;
  return num;
};

interface InventoryItem {
  tradePopularMetric: number | null;
  item_id: number;
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
  history?: Array<{
    UserId: number;
    TradeTime: number;
  }>;
}

interface InventoryData {
  user_id: string;
  data: InventoryItem[];
  item_count: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
  bot_id: string;
  scan_count: number;
  created_at: number;
  updated_at: number;
}

interface UserStatsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  userConnectionData?: UserConnectionData | null;
  itemsData?: Item[];
  dupedItems?: unknown[];
  isLoadingDupes?: boolean;
  onDataRefresh?: (data: InventoryData) => void;
  currentSeason?: Season | null;
}

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

// Helper functions
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (Math.floor(num / 100000) / 10).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (Math.floor(num / 100) / 10).toFixed(1) + "K";
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

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = "/assets/images/placeholder.png";
};

export default function UserStats({
  initialData,
  robloxUsers,
  robloxAvatars,
  userConnectionData,
  itemsData: propItemsData,
  dupedItems = [],
  isLoadingDupes = false,
  onDataRefresh,
  currentSeason = null,
}: UserStatsProps) {
  const [totalCashValue, setTotalCashValue] = useState<number>(0);
  const [totalDupedValue, setTotalDupedValue] = useState<number>(0);
  const [isLoadingValues, setIsLoadingValues] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshedData, setRefreshedData] = useState<InventoryData | null>(
    null,
  );

  // Check if data is relatively fresh (less than 10 minutes old)
  const isDataFresh = () => {
    const now = Date.now() / 1000; // Convert to seconds
    const dataAge = now - currentData.updated_at;
    const tenMinutes = 10 * 60; // 10 minutes in seconds
    return dataAge < tenMinutes;
  };

  // Auth context and scan functionality
  const { user, isAuthenticated, setShowLoginModal } = useAuthContext();
  const scanWebSocket = useScanWebSocket(initialData.user_id);

  // Supporter modal functionality
  const { modalState, closeModal, openModal } = useSupporterModal();

  // Check if current user is viewing their own inventory
  const isOwnInventory =
    isAuthenticated && user?.roblox_id === initialData.user_id;

  // Check if user has access to refresh feature (requires Supporter II+)
  const checkRefreshAccess = () => {
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return false;
    }

    const userTier = user.premiumtype || 0;
    if (userTier < 2) {
      openModal({
        feature: "inventory_refresh",
        currentTier: userTier,
        requiredTier: 2,
        currentLimit:
          userTier === 0 ? "Free" : userTier === 1 ? "Supporter I" : "Unknown",
        requiredLimit: "Supporter II",
      });
      return false;
    }
    return true;
  };

  // Use refreshed data if available, otherwise use initial data
  const currentData = refreshedData || initialData;

  // Real-time relative timestamps
  const createdRelativeTime = useRealTimeRelativeDate(currentData.created_at);
  const updatedRelativeTime = useRealTimeRelativeDate(currentData.updated_at);

  // Refresh function
  const handleRefresh = async () => {
    if (isRefreshing) return;

    // Check if user has access to refresh feature
    if (!checkRefreshAccess()) return;

    setIsRefreshing(true);
    try {
      const response = await fetch("/api/inventories/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ robloxId: initialData.user_id }),
      });

      const result = await response.json();

      if (response.ok && !result.error) {
        setRefreshedData(result);
        // Notify parent component of refreshed data
        if (onDataRefresh) {
          onDataRefresh(result);
        }
        toast.success("Inventory data refreshed successfully!", {
          duration: 3000,
          position: "bottom-right",
        });
      } else {
        toast.error(result.message || "Failed to refresh inventory data", {
          duration: 5000,
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error refreshing inventory data:", error);
      toast.error("Failed to refresh inventory data. Please try again.", {
        duration: 5000,
        position: "bottom-right",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show toast notifications for scan status
  useEffect(() => {
    if (
      scanWebSocket.message &&
      scanWebSocket.message.includes("User not found in game")
    ) {
      toast.error(
        "User not found in game. Please join a trade server and try again.",
        {
          duration: 5000,
          position: "bottom-right",
        },
      );
    } else if (
      scanWebSocket.message &&
      scanWebSocket.message.includes("User found in game")
    ) {
      toast.success("User found in game - scan in progress!", {
        duration: 3000,
        position: "bottom-right",
      });
    } else if (
      scanWebSocket.message &&
      scanWebSocket.message.includes("Bot joined server")
    ) {
      toast.success("Bot joined server, scanning...", {
        duration: 3000,
        position: "bottom-right",
      });
    } else if (
      scanWebSocket.status === "completed" &&
      scanWebSocket.message &&
      scanWebSocket.message.includes("Added to queue")
    ) {
      toast.success(scanWebSocket.message, {
        duration: 5000,
        position: "bottom-right",
      });
    } else if (
      scanWebSocket.status === "error" &&
      scanWebSocket.error &&
      scanWebSocket.error.includes("No bots available")
    ) {
      toast.error(
        "No scan bots are currently online. Please try again later.",
        {
          duration: 5000,
          position: "bottom-right",
        },
      );
    }
  }, [scanWebSocket.message, scanWebSocket.status, scanWebSocket.error]);

  // Helper function to get user display name
  const getUserDisplay = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.displayName || user?.name || userId;
  };

  // Helper function to get username
  const getUsername = (userId: string) => {
    const user = robloxUsers[userId];
    return user?.name || userId;
  };

  // Helper function to get user avatar
  const getUserAvatar = (userId: string) => {
    const avatar = robloxAvatars[userId];
    return avatar && typeof avatar === "string" && avatar.trim() !== ""
      ? avatar
      : null;
  };

  // Calculate total values
  useEffect(() => {
    const calculateTotalValues = () => {
      if (!propItemsData || propItemsData.length === 0) {
        setTotalCashValue(0);
        setTotalDupedValue(0);
        setIsLoadingValues(false);
        return;
      }

      try {
        setIsLoadingValues(true);

        let totalCash = 0;

        // Create a map of item_id to item data for quick lookup
        const itemMap = new Map();
        propItemsData.forEach((item) => {
          itemMap.set(item.id, item);
        });

        // Calculate cash value from inventory items
        currentData.data.forEach((inventoryItem) => {
          const itemData = itemMap.get(inventoryItem.item_id);
          if (itemData) {
            const cashValue = parseCashValueForTotal(itemData.cash_value);
            totalCash += cashValue;
          }
        });

        setTotalCashValue(totalCash);
      } catch {
      } finally {
        setIsLoadingValues(false);
      }
    };

    if (!currentData?.data || currentData.data.length === 0) {
      setTotalCashValue(0);
      setTotalDupedValue(0);
      setIsLoadingValues(false);
      return;
    }
    calculateTotalValues();
  }, [currentData, propItemsData]);

  // Calculate total duped value from actual duped items
  useEffect(() => {
    const calculateDupedValue = () => {
      if (
        !propItemsData ||
        propItemsData.length === 0 ||
        !dupedItems ||
        dupedItems.length === 0
      ) {
        setTotalDupedValue(0);
        return;
      }

      try {
        let totalDuped = 0;

        // Create a map of item_id to item data for quick lookup
        const itemMap = new Map();
        propItemsData.forEach((item) => {
          itemMap.set(item.id, item);
        });

        // Calculate duped value from actual duped items using DupeFinder logic
        dupedItems.forEach((dupeItem) => {
          const itemData = itemMap.get(
            (dupeItem as { item_id: number }).item_id,
          );
          if (itemData) {
            let dupedValue = parseCashValueForTotal(itemData.duped_value);

            // If main item doesn't have duped value, check children/variants based on created date
            if ((isNaN(dupedValue) || dupedValue <= 0) && itemData.children) {
              // Get the year from the created date (from item info)
              const createdAtInfo = (
                dupeItem as { info: Array<{ title: string; value: string }> }
              ).info.find((info) => info.title === "Created At");
              const createdYear = createdAtInfo
                ? new Date(createdAtInfo.value).getFullYear().toString()
                : null;

              // Find the child variant that matches the created year
              const matchingChild = createdYear
                ? itemData.children.find(
                    (child: {
                      sub_name: string;
                      data: { duped_value: string | null };
                    }) =>
                      child.sub_name === createdYear &&
                      child.data &&
                      child.data.duped_value &&
                      child.data.duped_value !== "N/A" &&
                      child.data.duped_value !== null,
                  )
                : null;

              if (matchingChild) {
                dupedValue = parseCashValueForTotal(
                  matchingChild.data.duped_value,
                );
              }
            }

            // Only use duped values, ignore cash values
            if (!isNaN(dupedValue) && dupedValue > 0) {
              totalDuped += dupedValue;
            }
          }
        });

        setTotalDupedValue(totalDuped);
      } catch (error) {
        console.error("Error calculating duped value:", error);
        setTotalDupedValue(0);
      }
    };

    calculateDupedValue();
  }, [dupedItems, propItemsData]);

  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="text-muted mb-4 text-xl font-semibold">
        User Information
      </h2>

      {/* Roblox User Profile */}
      {currentData?.user_id && (
        <div className="mb-6 flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center">
          {getUserAvatar(currentData.user_id) ? (
            <Image
              src={getUserAvatar(currentData.user_id)!}
              alt="Roblox Avatar"
              width={64}
              height={64}
              className="flex-shrink-0 rounded-full bg-[#2E3944]"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#2E3944]">
              <svg
                className="text-muted h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-muted text-lg font-bold break-words">
              {getUserDisplay(currentData.user_id)}
            </h3>
            <p className="text-muted text-sm break-words opacity-75">
              @{getUsername(currentData.user_id)}
            </p>

            {/* Connection Icons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Discord Profile - Only show if userConnectionData exists */}
              {userConnectionData && (
                <Tooltip
                  title="Visit Discord Profile"
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
                  <a
                    href={`https://discord.com/users/${userConnectionData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
                  >
                    <DiscordIcon className="h-4 w-4 flex-shrink-0 text-[#5865F2]" />
                    <span className="text-sm font-medium">Discord</span>
                  </a>
                </Tooltip>
              )}

              {/* Roblox Profile - Always show since we have Roblox data */}
              <Tooltip
                title="Visit Roblox Profile"
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
                <a
                  href={`https://www.roblox.com/users/${currentData.user_id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RobloxIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Roblox</span>
                </a>
              </Tooltip>

              {/* Website Profile - Only show if userConnectionData exists */}
              {userConnectionData && (
                <Tooltip
                  title="Visit Website Profile"
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
                  <Link
                    href={`/users/${userConnectionData.id}`}
                    className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
                  >
                    <Image
                      src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                      alt="JBCL Logo"
                      width={16}
                      height={16}
                      className="h-4 w-4 flex-shrink-0"
                    />
                    <span className="text-sm font-medium">Website Profile</span>
                  </Link>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Scan Button or Login Prompt */}
          {isOwnInventory ? (
            <div className="mt-4 space-y-3">
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:flex-row lg:gap-3">
                <button
                  onClick={scanWebSocket.startScan}
                  disabled={
                    scanWebSocket.status === "scanning" ||
                    scanWebSocket.status === "connecting" ||
                    scanWebSocket.isSlowmode
                  }
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    scanWebSocket.status === "scanning" ||
                    scanWebSocket.status === "connecting" ||
                    scanWebSocket.isSlowmode
                      ? "cursor-progress bg-gray-600 text-gray-400"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {scanWebSocket.status === "connecting" ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Connecting...
                    </>
                  ) : scanWebSocket.isSlowmode ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Cooldown ({scanWebSocket.slowmodeTimeLeft}s)
                    </>
                  ) : scanWebSocket.status === "scanning" ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {scanWebSocket.message &&
                      scanWebSocket.message.includes("Bot joined server")
                        ? "Scanning..."
                        : scanWebSocket.message &&
                            scanWebSocket.message.includes("Retrying")
                          ? "Retrying..."
                          : scanWebSocket.message &&
                              scanWebSocket.message.includes(
                                "You will be scanned when you join",
                              )
                            ? "Processing..."
                            : scanWebSocket.message || "Processing..."}
                    </>
                  ) : scanWebSocket.status === "completed" ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Scan Complete
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Scan Inventory
                    </>
                  )}
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isDataFresh()}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isRefreshing
                      ? "cursor-progress bg-[#37424D] text-gray-400"
                      : isDataFresh()
                        ? "cursor-not-allowed bg-[#37424D] text-gray-400"
                        : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                  }`}
                >
                  {isRefreshing ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Refreshing...
                    </>
                  ) : isDataFresh() ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Recently Updated
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Data
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar - Only show when progress is defined */}
              {scanWebSocket.progress !== undefined &&
                scanWebSocket.status === "scanning" && (
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                      <span>Progress</span>
                      <span>{scanWebSocket.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-green-600 transition-all duration-300"
                        style={{ width: `${scanWebSocket.progress}%` }}
                      />
                    </div>
                  </div>
                )}

              {/* Error Message - but not for "user not found" since that gets a toast */}
              {scanWebSocket.error &&
                !scanWebSocket.error.includes("User not found in game") && (
                  <div className="mt-2 text-sm text-red-400">
                    Error: {scanWebSocket.error}
                  </div>
                )}
            </div>
          ) : (
            <div className="mt-4">
              <div className="rounded-lg border border-[#37424D] bg-[#2E3944] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="mt-0.5 h-5 w-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 text-sm font-medium text-white">
                      Want on-demand scans?
                    </h4>
                    <p className="mb-3 text-sm text-gray-400">
                      {!isAuthenticated
                        ? "Login and connect your Roblox account to request instant inventory scans anytime."
                        : user?.roblox_id
                          ? "You can request instant inventory scans anytime from your own inventory page."
                          : "Connect your Roblox account to request instant inventory scans anytime."}
                    </p>
                    <div className="flex gap-2">
                      {!isAuthenticated ? (
                        <Link
                          href="/faq"
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752C4]"
                        >
                          Learn More
                        </Link>
                      ) : user?.roblox_id ? (
                        <Link
                          href={`/inventories/${user.roblox_id}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752C4]"
                        >
                          View My Inventory
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setShowLoginModal(true);
                            const event = new CustomEvent("setLoginTab", {
                              detail: 1,
                            });
                            window.dispatchEvent(event);
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#FF5630] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#E54B2C]"
                        >
                          Connect Roblox Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
        <div className="text-center">
          <div className="text-muted text-sm">Total Items</div>
          <Tooltip
            title={currentData.item_count.toLocaleString()}
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
            <div className="cursor-help text-2xl font-bold text-white">
              {formatNumber(currentData.item_count)}
            </div>
          </Tooltip>
        </div>
        <div className="text-center">
          <div className="text-muted text-sm">Original Items</div>
          <Tooltip
            title={currentData.data
              .filter((item) => item.isOriginalOwner)
              .length.toLocaleString()}
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
            <div className="cursor-help text-2xl font-bold text-[#4ade80]">
              {formatNumber(
                currentData.data.filter((item) => item.isOriginalOwner).length,
              )}
            </div>
          </Tooltip>
        </div>
        <div className="text-center">
          <div className="text-muted text-sm">Non-Original</div>
          <Tooltip
            title={currentData.data
              .filter((item) => !item.isOriginalOwner)
              .length.toLocaleString()}
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
            <div className="cursor-help text-2xl font-bold text-[#ff6b6b]">
              {formatNumber(
                currentData.data.filter((item) => !item.isOriginalOwner).length,
              )}
            </div>
          </Tooltip>
        </div>
        <div className="hidden text-center xl:block">
          <div className="text-muted text-sm">Money</div>
          <Tooltip
            title={`$${currentData.money.toLocaleString()}`}
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
            <div className="cursor-help text-2xl font-bold text-[#4ade80]">
              {formatMoney(currentData.money)}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* XP Progress Bar */}
      <XpProgressBar
        currentLevel={currentData.level}
        currentXp={currentData.xp}
        season={currentSeason}
      />

      {/* Money gets its own row for mobile and tablet */}
      <div className="mt-4 text-center xl:hidden">
        <div className="text-muted text-sm">Money</div>
        <Tooltip
          title={`$${currentData.money.toLocaleString()}`}
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
          <div className="cursor-help text-2xl font-bold text-[#4ade80]">
            {formatMoney(currentData.money)}
          </div>
        </Tooltip>
      </div>

      {/* Total Values */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[#37424D] bg-[#2E3944] p-4 text-center">
          <div className="text-muted mb-2 text-sm">Total Cash Value</div>
          {isLoadingValues ? (
            <div className="animate-pulse text-2xl font-bold text-[#1d7da3]">
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
              <div className="cursor-help text-2xl font-bold text-white">
                {formatPreciseMoney(totalCashValue)}
              </div>
            </Tooltip>
          )}
        </div>
        <div className="rounded-lg border border-[#37424D] bg-[#2E3944] p-4 text-center">
          <div className="text-muted mb-2 text-sm">Total Duped Value</div>
          {isLoadingValues || isLoadingDupes ? (
            <div className="animate-pulse text-2xl font-bold text-gray-400">
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
              <div className="cursor-help text-2xl font-bold text-white">
                {formatPreciseMoney(totalDupedValue)}
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Gamepasses */}
      {currentData.gamepasses.length > 0 && (
        <div className="mt-6">
          <h3 className="text-muted mb-2 text-lg font-medium">Gamepasses</h3>
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
                  <div className="text-muted flex items-center gap-2 rounded-lg border border-[#5865F2] bg-[#2B2F4C] px-3 py-2 text-sm transition-colors hover:bg-[#32365A]">
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
      <div className="text-muted mt-4 space-y-1 text-sm">
        <p>
          <span className="font-semibold text-white">Scan Count:</span>{" "}
          {currentData.scan_count}
        </p>
        <p>
          <span className="font-semibold text-white">First Scanned:</span>{" "}
          {formatDate(currentData.created_at)} ({createdRelativeTime})
        </p>
        <p>
          <span className="font-semibold text-white">Last Scanned:</span>{" "}
          {formatDate(currentData.updated_at)} ({updatedRelativeTime})
        </p>
      </div>

      {/* Supporter Modal */}
      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature}
        currentTier={modalState.currentTier}
        requiredTier={modalState.requiredTier}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </div>
  );
}
