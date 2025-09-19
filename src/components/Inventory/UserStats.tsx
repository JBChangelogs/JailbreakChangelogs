"use client";

import { useState, useEffect, useCallback } from "react";
import { RobloxUser, Item } from "@/types";
import { Season } from "@/types/seasons";
import {
  InventoryData,
  InventoryItem,
  UserConnectionData,
} from "@/app/inventories/types";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { logError } from "@/services/logger";
import UserProfileSection from "./UserProfileSection";
import UserStatsSection from "./UserStatsSection";

interface UserStatsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  userConnectionData: UserConnectionData | null;
  currentSeason: Season | null;
  itemsData: Item[];
  dupedItems: InventoryItem[];
  onRefresh: (newData: InventoryData) => Promise<void>;
}

// Helper function to parse cash value strings for totals (returns 0 for N/A)
const parseCashValueForTotal = (value: string | null): number => {
  if (value === null || value === "N/A") return 0;
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (value.toLowerCase().includes("k")) return num * 1000;
  if (value.toLowerCase().includes("m")) return num * 1000000;
  if (value.toLowerCase().includes("b")) return num * 1000000000;
  return num;
};

export default function UserStats({
  initialData,
  robloxUsers,
  robloxAvatars,
  userConnectionData,
  currentSeason,
  itemsData,
  dupedItems,
  onRefresh,
}: UserStatsProps) {
  // State management
  const [totalCashValue, setTotalCashValue] = useState<number>(0);
  const [totalDupedValue, setTotalDupedValue] = useState<number>(0);
  const [isLoadingValues, setIsLoadingValues] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshedData, setRefreshedData] = useState<InventoryData | null>(
    null,
  );

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

  const getUserAvatar = useCallback(
    (userId: string) => {
      return robloxAvatars[userId] || "";
    },
    [robloxAvatars],
  );

  // Calculate cash value
  useEffect(() => {
    const calculateCashValue = () => {
      try {
        let totalCash = 0;
        const itemMap = new Map(itemsData.map((item) => [item.id, item]));

        initialData.data.forEach((inventoryItem) => {
          const itemData = itemMap.get(inventoryItem.item_id);
          if (itemData) {
            const cashValue = parseCashValueForTotal(itemData.cash_value);
            if (!isNaN(cashValue) && cashValue > 0) {
              totalCash += cashValue;
            }
          }
        });

        setTotalCashValue(totalCash);
      } catch (error) {
        logError("Error calculating cash value", error, {
          component: "UserStats",
          action: "calculateTotalCashValue",
        });
        setTotalCashValue(0);
      }
    };

    calculateCashValue();
  }, [initialData.data, itemsData]);

  // Calculate duped value
  useEffect(() => {
    const calculateDupedValue = () => {
      try {
        let totalDuped = 0;
        const itemMap = new Map(itemsData.map((item) => [item.id, item]));

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
        logError("Error calculating duped value", error, {
          component: "UserStats",
          action: "calculateTotalDupedValue",
        });
        setTotalDupedValue(0);
      }
    };

    calculateDupedValue();
  }, [dupedItems, itemsData]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh(initialData);
      setRefreshedData(initialData);
    } catch (error) {
      logError("Error refreshing data", error, {
        component: "UserStats",
        action: "handleRefresh",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Set loading state
  useEffect(() => {
    setIsLoadingValues(false);
  }, [totalCashValue, totalDupedValue]);

  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="text-muted mb-4 text-xl font-semibold">
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
          currentData={initialData}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          refreshedData={refreshedData}
        />
      )}

      {/* User Stats Section */}
      <UserStatsSection
        currentData={initialData}
        currentSeason={currentSeason}
        totalCashValue={totalCashValue}
        totalDupedValue={totalDupedValue}
        isLoadingValues={isLoadingValues}
      />
    </div>
  );
}
