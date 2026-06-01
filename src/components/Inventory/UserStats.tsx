"use client";

import { useCallback, useMemo } from "react";
import { RobloxUser, Item } from "@/types";
import { Season } from "@/types/seasons";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { UseScanWebSocketReturn } from "@/hooks/useScanWebSocket";
import UserProfileSection from "./UserProfileSection";
import UserStatsSection from "./UserStatsSection";
import { UserNetworthData } from "@/utils/api/api";

interface UserStatsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  userConnectionData: UserConnectionData | null;
  currentSeason: Season | null;
  seasonRateLimitMessage?: string;
  itemsData: Item[];
  initialNetworthData?: UserNetworthData[];
  showOnlyNonOriginal: boolean;
  showOnlyOriginal: boolean;
  showOnlyLimited: boolean;
  showOnlySeasonal: boolean;
  scanWebSocket: UseScanWebSocketReturn;
}

export default function UserStats({
  initialData,
  robloxUsers,
  userConnectionData,
  currentSeason,
  seasonRateLimitMessage,
  itemsData = [],
  initialNetworthData = [],
  showOnlyNonOriginal,
  showOnlyOriginal,
  showOnlyLimited,
  showOnlySeasonal,
  scanWebSocket,
}: UserStatsProps) {
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

  // Calculate Non-OG values and total duped value client-side
  const nonOgStats = useMemo(() => {
    if (!itemsData || itemsData.length === 0) {
      return {
        inventoryValue: 0,
        networth: 0,
        dupedValue: 0,
        totalDupedValue: 0,
        itemCount: 0,
        dupedItemCount: 0,
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
    let totalDupedValue = 0;
    let nonOgItemCount = 0;
    let nonOgDupedItemCount = 0;

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

    // Duped items — compute both total (all) and non-OG only in one pass
    (initialData.duplicates || []).forEach((invItem) => {
      const item = itemsMap.get(invItem.item_id.toString());
      if (item) {
        totalDupedValue += parse(item.duped_value);
      }
      if (!invItem.isOriginalOwner) {
        nonOgItemCount++;
        nonOgDupedItemCount++;
        if (item) {
          nonOgDupedValue += parse(item.duped_value);
        }
      }
    });

    return {
      inventoryValue: nonOgInventoryValue,
      dupedValue: nonOgDupedValue,
      totalDupedValue,
      networth:
        nonOgInventoryValue +
        nonOgDupedValue +
        (Number(initialData.money) || 0),
      itemCount: nonOgItemCount,
      dupedItemCount: nonOgDupedItemCount,
    };
  }, [itemsData, initialData]);

  const totalDupedValue = nonOgStats.totalDupedValue;

  const ogStats = useMemo(() => {
    if (!itemsData || itemsData.length === 0) {
      return {
        inventoryValue: 0,
        networth: 0,
        dupedValue: 0,
        itemCount: 0,
        dupedItemCount: 0,
      };
    }

    const itemsMap = new Map(
      itemsData.map((item) => [item.id.toString(), item]),
    );
    const parse = (val: string | null) => {
      if (!val || val === "N/A") return 0;
      const cleanVal = val.replace(/,/g, "").toLowerCase();
      const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return 0;
      if (cleanVal.includes("k")) return num * 1000;
      if (cleanVal.includes("m")) return num * 1000000;
      if (cleanVal.includes("b")) return num * 1000000000;
      return num;
    };

    let ogInventoryValue = 0;
    let ogDupedValue = 0;
    let ogItemCount = 0;
    let ogDupedItemCount = 0;

    initialData.data.forEach((invItem) => {
      if (invItem.isOriginalOwner) {
        ogItemCount++;
        const item = itemsMap.get(invItem.item_id.toString());
        if (item) ogInventoryValue += parse(item.cash_value);
      }
    });

    (initialData.duplicates || []).forEach((invItem) => {
      if (invItem.isOriginalOwner) {
        ogItemCount++;
        ogDupedItemCount++;
        const item = itemsMap.get(invItem.item_id.toString());
        if (item) ogDupedValue += parse(item.duped_value);
      }
    });

    return {
      inventoryValue: ogInventoryValue,
      dupedValue: ogDupedValue,
      networth: ogInventoryValue + ogDupedValue,
      itemCount: ogItemCount,
      dupedItemCount: ogDupedItemCount,
    };
  }, [itemsData, initialData]);

  const limitedStats = useMemo(() => {
    if (!itemsData || itemsData.length === 0) {
      return {
        inventoryValue: 0,
        networth: 0,
        dupedValue: 0,
        itemCount: 0,
        dupedItemCount: 0,
      };
    }

    const itemsMap = new Map(
      itemsData.map((item) => [item.id.toString(), item]),
    );
    const parse = (val: string | null) => {
      if (!val || val === "N/A") return 0;
      const cleanVal = val.replace(/,/g, "").toLowerCase();
      const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return 0;
      if (cleanVal.includes("k")) return num * 1000;
      if (cleanVal.includes("m")) return num * 1000000;
      if (cleanVal.includes("b")) return num * 1000000000;
      return num;
    };

    let limitedInventoryValue = 0;
    let limitedDupedValue = 0;
    let limitedItemCount = 0;
    let limitedDupedItemCount = 0;

    initialData.data.forEach((invItem) => {
      const item = itemsMap.get(invItem.item_id.toString());
      if (item && item.is_limited === 1) {
        limitedItemCount++;
        limitedInventoryValue += parse(item.cash_value);
      }
    });

    (initialData.duplicates || []).forEach((invItem) => {
      const item = itemsMap.get(invItem.item_id.toString());
      if (item && item.is_limited === 1) {
        limitedItemCount++;
        limitedDupedItemCount++;
        limitedDupedValue += parse(item.duped_value);
      }
    });

    return {
      inventoryValue: limitedInventoryValue,
      dupedValue: limitedDupedValue,
      networth: limitedInventoryValue + limitedDupedValue,
      itemCount: limitedItemCount,
      dupedItemCount: limitedDupedItemCount,
    };
  }, [itemsData, initialData]);

  const seasonalStats = useMemo(() => {
    if (!itemsData || itemsData.length === 0) {
      return {
        inventoryValue: 0,
        networth: 0,
        dupedValue: 0,
        itemCount: 0,
        dupedItemCount: 0,
      };
    }

    const itemsMap = new Map(
      itemsData.map((item) => [item.id.toString(), item]),
    );
    const parse = (val: string | null) => {
      if (!val || val === "N/A") return 0;
      const cleanVal = val.replace(/,/g, "").toLowerCase();
      const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return 0;
      if (cleanVal.includes("k")) return num * 1000;
      if (cleanVal.includes("m")) return num * 1000000;
      if (cleanVal.includes("b")) return num * 1000000000;
      return num;
    };

    let seasonalInventoryValue = 0;
    let seasonalDupedValue = 0;
    let seasonalItemCount = 0;
    let seasonalDupedItemCount = 0;

    initialData.data.forEach((invItem) => {
      const item = itemsMap.get(invItem.item_id.toString());
      if (item && item.is_seasonal === 1) {
        seasonalItemCount++;
        seasonalInventoryValue += parse(item.cash_value);
      }
    });

    (initialData.duplicates || []).forEach((invItem) => {
      const item = itemsMap.get(invItem.item_id.toString());
      if (item && item.is_seasonal === 1) {
        seasonalItemCount++;
        seasonalDupedItemCount++;
        seasonalDupedValue += parse(item.duped_value);
      }
    });

    return {
      inventoryValue: seasonalInventoryValue,
      dupedValue: seasonalDupedValue,
      networth: seasonalInventoryValue + seasonalDupedValue,
      itemCount: seasonalItemCount,
      dupedItemCount: seasonalDupedItemCount,
    };
  }, [itemsData, initialData]);

  // Since we are deriving values directly from props, they are always available (or 0)
  // We can treat loading as false since there's no async operation here
  const isLoadingValues = false;

  // Set loading state

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
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
          scanWebSocket={scanWebSocket}
        />
      )}

      {/* User Stats Section */}
      <UserStatsSection
        currentData={initialData}
        currentSeason={currentSeason}
        seasonRateLimitMessage={seasonRateLimitMessage}
        totalCashValue={totalCashValue}
        totalNetworth={totalNetworth}
        totalDupedValue={totalDupedValue}
        nonOgStats={nonOgStats}
        showOnlyNonOriginal={showOnlyNonOriginal}
        showOnlyOriginal={showOnlyOriginal}
        ogStats={ogStats}
        limitedStats={limitedStats}
        showOnlyLimited={showOnlyLimited}
        seasonalStats={seasonalStats}
        showOnlySeasonal={showOnlySeasonal}
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
