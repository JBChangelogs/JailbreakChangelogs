"use client";

import { useCallback, useMemo } from "react";
import { RobloxUser, Item } from "@/types";
import { Season } from "@/types/seasons";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import UserProfileSection from "./UserProfileSection";
import UserStatsSection from "./UserStatsSection";
import { UserNetworthData } from "@/utils/api";

interface UserStatsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  userConnectionData: UserConnectionData | null;
  currentSeason: Season | null;
  itemsData: Item[];
  initialNetworthData?: UserNetworthData[];
  showNonOgOnly: boolean;
  setShowNonOgOnly: (val: boolean) => void;
}

export default function UserStats({
  initialData,
  robloxUsers,
  userConnectionData,
  currentSeason,
  itemsData = [],
  initialNetworthData = [],
  showNonOgOnly,
  setShowNonOgOnly,
}: UserStatsProps) {
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
      ? initialNetworthData[0]
      : null;
  }, [initialNetworthData]);

  const totalNetworth = latestNetworthData?.networth || 0;
  const totalCashValue = latestNetworthData?.inventory_value || 0;
  const totalDupedValue = latestNetworthData?.duplicates_value ?? 0;

  // Calculate Non-OG values
  const nonOgStats = useMemo(() => {
    if (!itemsData || itemsData.length === 0) {
      return {
        inventoryValue: 0,
        networth: 0,
        dupedValue: 0,
        itemCount: 0,
      };
    }

    const itemsMap = new Map(
      itemsData.map((item) => [item.id.toString(), item]),
    );
    const parse = (val: string | null) => {
      if (!val || val === "N/A") return 0;
      // Remove commas and other non-numeric characters except period
      const cleanVal = val.replace(/,/g, "").toLowerCase();
      const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return 0;

      if (cleanVal.includes("k")) return num * 1000;
      if (cleanVal.includes("m")) return num * 1000000;
      if (cleanVal.includes("b")) return num * 1000000000;
      return num;
    };

    let nonOgInventoryValue = 0;
    let nonOgDupedValue = 0;
    let nonOgItemCount = 0;

    // Clean items
    initialData.data.forEach((invItem) => {
      if (!invItem.isOriginalOwner) {
        nonOgItemCount++;
        const item = itemsMap.get(invItem.item_id.toString());
        if (item) {
          nonOgInventoryValue += parse(item.cash_value);
        }
      }
    });

    // Duped items
    (initialData.duplicates || []).forEach((invItem) => {
      if (!invItem.isOriginalOwner) {
        nonOgItemCount++;
        const item = itemsMap.get(invItem.item_id.toString());
        if (item) {
          nonOgDupedValue += parse(item.duped_value);
        }
      }
    });

    return {
      inventoryValue: nonOgInventoryValue,
      dupedValue: nonOgDupedValue,
      networth:
        nonOgInventoryValue +
        nonOgDupedValue +
        (Number(initialData.money) || 0),
      itemCount: nonOgItemCount,
    };
  }, [itemsData, initialData]);

  // Since we are deriving values directly from props, they are always available (or 0)
  // We can treat loading as false since there's no async operation here
  const isLoadingValues = false;

  // Set loading state

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
        />
      )}

      {/* User Stats Section */}
      <UserStatsSection
        currentData={initialData}
        currentSeason={currentSeason}
        totalCashValue={totalCashValue}
        totalNetworth={totalNetworth}
        totalDupedValue={totalDupedValue}
        nonOgStats={nonOgStats}
        showNonOgOnly={showNonOgOnly}
        setShowNonOgOnly={setShowNonOgOnly}
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
