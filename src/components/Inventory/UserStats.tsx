"use client";

import { useCallback, useMemo } from "react";
import { RobloxUser, Item } from "@/types";
import { Season } from "@/types/seasons";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { UseScanWebSocketReturn } from "@/hooks/useScanWebSocket";
import UserProfileSection from "./UserProfileSection";
import UserStatsSection from "./UserStatsSection";
import { UserNetworthData } from "@/utils/api/api";
import { useBatchItems } from "@/hooks/useBatchItems";

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
  scanWebSocket: UseScanWebSocketReturn;
  scanErrorBanner?: { title: string; subtitle?: string } | null;
  queuePosition?: { position: number; delay: number } | null;
  isLoadingQueuePosition?: boolean;
  queueStatusMessage?: string;
  fetchQueuePosition?: () => void;
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
  scanWebSocket,
  scanErrorBanner,
  queuePosition,
  isLoadingQueuePosition,
  queueStatusMessage,
  fetchQueuePosition,
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
  const limitedFilterIds = useMemo(
    () =>
      Array.from(
        new Set(
          [...initialData.data, ...(initialData.duplicates ?? [])].map(
            (item) => item.item_id,
          ),
        ),
      ),
    [initialData.data, initialData.duplicates],
  );
  const limitedItemsQuery = useBatchItems(limitedFilterIds, showOnlyLimited);

  const parseValue = (val: string | null): number => {
    if (!val || val === "N/A") return 0;
    const cleanVal = val.replace(/,/g, "").toLowerCase();
    const num = parseFloat(cleanVal.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return 0;
    if (cleanVal.includes("k")) return num * 1000;
    if (cleanVal.includes("m")) return num * 1000000;
    if (cleanVal.includes("b")) return num * 1000000000;
    return num;
  };

  const totalDupedValue = useMemo(() => {
    if (latestNetworthData?.duplicates_value != null) {
      return latestNetworthData.duplicates_value;
    }
    return (initialData.duplicates || []).reduce(
      (sum, invItem) =>
        sum +
        parseValue(
          invItem.info.find((entry) => entry.title === "Duped Value")?.value ??
            null,
        ),
      0,
    );
  }, [initialData.duplicates, latestNetworthData]);

  const activeFilteredStats = useMemo(() => {
    const anyFilterActive =
      showOnlyOriginal || showOnlyNonOriginal || showOnlyLimited;
    if (!anyFilterActive || (showOnlyLimited && !limitedItemsQuery.data))
      return null;

    const itemsMap = new Map(
      (limitedItemsQuery.data ?? itemsData).map((item) => [
        item.id.toString(),
        item,
      ]),
    );

    let inventoryValue = 0;
    let dupedValue = 0;
    let itemCount = 0;
    let dupedItemCount = 0;

    initialData.data.forEach((invItem) => {
      if (showOnlyOriginal && !invItem.isOriginalOwner) return;
      if (showOnlyNonOriginal && invItem.isOriginalOwner) return;
      const item = itemsMap.get(invItem.item_id.toString());
      if (showOnlyLimited && item?.is_limited !== 1) return;
      itemCount++;
      inventoryValue += parseValue(
        invItem.info.find((entry) => entry.title === "Cash Value")?.value ??
          item?.cash_value ??
          null,
      );
    });

    (initialData.duplicates || []).forEach((invItem) => {
      if (showOnlyOriginal && !invItem.isOriginalOwner) return;
      if (showOnlyNonOriginal && invItem.isOriginalOwner) return;
      const item = itemsMap.get(invItem.item_id.toString());
      if (showOnlyLimited && item?.is_limited !== 1) return;
      itemCount++;
      dupedItemCount++;
      dupedValue += parseValue(
        invItem.info.find((entry) => entry.title === "Duped Value")?.value ??
          item?.duped_value ??
          null,
      );
    });

    const money = showOnlyNonOriginal ? Number(initialData.money) || 0 : 0;

    return {
      inventoryValue,
      dupedValue,
      networth: inventoryValue + dupedValue + money,
      itemCount,
      dupedItemCount,
    };
  }, [
    itemsData,
    initialData,
    showOnlyOriginal,
    showOnlyNonOriginal,
    showOnlyLimited,
    limitedItemsQuery.data,
  ]);

  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (showOnlyOriginal) parts.push("OG");
    if (showOnlyNonOriginal) parts.push("Non-OG");
    if (showOnlyLimited) parts.push("Limited");
    return parts.join(" + ");
  }, [showOnlyOriginal, showOnlyNonOriginal, showOnlyLimited]);

  // Since we are deriving values directly from props, they are always available (or 0)
  // We can treat loading as false since there's no async operation here
  const isLoadingValues = showOnlyLimited && limitedItemsQuery.isPending;

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
          scanErrorBanner={scanErrorBanner}
          queuePosition={queuePosition}
          isLoadingQueuePosition={isLoadingQueuePosition}
          queueStatusMessage={queueStatusMessage}
          fetchQueuePosition={fetchQueuePosition}
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
        activeFilteredStats={activeFilteredStats}
        filterLabel={filterLabel}
        showOnlyNonOriginal={showOnlyNonOriginal}
        isLoadingValues={isLoadingValues}
        userId={initialData.user_id}
        hasDupedValue={
          latestNetworthData
            ? (latestNetworthData.duplicates_value ?? 0) > 0
            : false
        }
        totalItemsCount={initialData.item_count + (initialData.dupe_count || 0)}
        duplicatesCount={initialData.dupe_count}
      />
    </div>
  );
}
