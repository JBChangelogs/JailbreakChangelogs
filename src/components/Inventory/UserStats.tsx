"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RobloxUser, Item } from "@/types";
import { Season } from "@/types/seasons";
import {
  InventoryData,
  InventoryItem,
  UserConnectionData,
} from "@/app/inventories/types";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { logError } from "@/services/logger";
import toast from "react-hot-toast";
import UserProfileSection from "./UserProfileSection";
import UserStatsSection from "./UserStatsSection";
import { UserNetworthData } from "@/utils/api";

interface UserStatsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  userConnectionData: UserConnectionData | null;
  currentSeason: Season | null;
  itemsData: Item[];
  dupedItems: InventoryItem[];
  onRefresh: (newData: InventoryData) => Promise<void>;
  initialNetworthData?: UserNetworthData[];
}

export default function UserStats({
  initialData,
  robloxUsers,
  userConnectionData,
  currentSeason,
  onRefresh,
  initialNetworthData = [],
}: UserStatsProps) {
  const [totalCashValue, setTotalCashValue] = useState<number>(0);
  const [totalDupedValue, setTotalDupedValue] = useState<number>(0);
  const [totalNetworth, setTotalNetworth] = useState<number>(0);
  const [isLoadingValues, setIsLoadingValues] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // WebSocket for real-time updates
  useScanWebSocket(initialData.user_id);

  // Helper functions
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = robloxUsers[userId];
      if (!user) return userId;
      return user.displayName || user.name || userId;
    },
    [robloxUsers],
  );

  const getUsername = useCallback(
    (userId: string) => {
      const user = robloxUsers[userId];
      if (!user) return userId;
      return user.name || userId;
    },
    [robloxUsers],
  );

  const getUserAvatar = useCallback((userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  }, []);

  const getHasVerifiedBadge = useCallback(
    (userId: string) => {
      const user = robloxUsers[userId];
      return Boolean(user?.hasVerifiedBadge);
    },
    [robloxUsers],
  );

  // Use networth data from backend only - no fallback calculations
  const latestNetworthData = useMemo(() => {
    return initialNetworthData && initialNetworthData.length > 0
      ? initialNetworthData.reduce((latest, current) =>
          current.snapshot_time > latest.snapshot_time ? current : latest,
        )
      : null;
  }, [initialNetworthData]);

  useEffect(() => {
    const setValues = () => {
      try {
        if (latestNetworthData) {
          // Use backend calculated values only
          setTotalNetworth(latestNetworthData.networth || 0);
          setTotalCashValue(latestNetworthData.inventory_value || 0);
          // duplicates_value: null means no duplicates (use 0), undefined means not available (use 0)
          setTotalDupedValue(latestNetworthData.duplicates_value ?? 0);
        } else {
          // No networth data available - set to 0 (no fallback calculation)
          setTotalNetworth(0);
          setTotalCashValue(0);
          setTotalDupedValue(0);
        }
      } catch (error) {
        logError("Error setting values from networth data", error, {
          component: "UserStats",
          action: "setValuesFromNetworth",
        });
        setTotalCashValue(0);
        setTotalDupedValue(0);
        setTotalNetworth(0);
      }
    };

    setValues();
  }, [latestNetworthData]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Make API call to refresh inventory data
      const response = await fetch("/api/inventories/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ robloxId: initialData.user_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to refresh inventory data",
        );
      }

      const refreshedData = await response.json();

      // Update the parent component with new data
      await onRefresh(refreshedData);
    } catch (error) {
      logError("Error refreshing data", error, {
        component: "UserStats",
        action: "handleRefresh",
      });
      console.error("Refresh failed:", error);

      // Show error toast to user
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to refresh inventory data";
      toast.error(errorMessage, {
        duration: 5000,
        position: "bottom-right",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set loading state
  useEffect(() => {
    setIsLoadingValues(false);
  }, [totalCashValue]);

  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        User Information
      </h2>

      {/* User Profile Section */}
      {initialData?.user_id && (
        <UserProfileSection
          userId={initialData.user_id}
          userConnectionData={userConnectionData}
          getUserDisplay={getUserDisplay}
          getUsername={getUsername}
          getUserAvatar={getUserAvatar}
          getHasVerifiedBadge={getHasVerifiedBadge}
          currentData={initialData}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* User Stats Section */}
      <UserStatsSection
        currentData={initialData}
        currentSeason={currentSeason}
        totalCashValue={totalCashValue}
        totalNetworth={totalNetworth}
        totalDupedValue={totalDupedValue}
        isLoadingValues={isLoadingValues}
        userId={initialData.user_id}
        hasDupedValue={
          latestNetworthData
            ? (latestNetworthData.duplicates_value ?? 0) > 0
            : false
        }
        totalItemsCount={initialData.item_count + (initialData.dupe_count || 0)}
        duplicatesCount={initialData.dupe_count}
        robloxUsers={robloxUsers}
      />
    </div>
  );
}
