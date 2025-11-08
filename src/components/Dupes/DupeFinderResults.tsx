"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DupeFinderItem, RobloxUser, Item } from "@/types";
import { UserConnectionData } from "@/app/inventories/types";
import { parseCurrencyValue } from "@/utils/currency";
import { fetchMissingRobloxData } from "@/app/inventories/actions";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAdReloader } from "@/hooks/useAdReloader";
import { Icon } from "../UI/IconWrapper";
import { logError } from "@/services/logger";
import DupeUserInfo from "./DupeUserInfo";
import DupeFilters from "./DupeFilters";
import DupeItemsGrid from "./DupeItemsGrid";
import DupeSearchInput from "./DupeSearchInput";
import { mergeDupeFinderArrayWithMetadata } from "@/utils/inventoryMerge";

// Move pure function outside component to avoid dependency issues
const getDupedValueForItem = (
  itemData: Item,
  dupeItem: DupeFinderItem,
): number => {
  let dupedValue = parseCurrencyValue(itemData.duped_value);

  if ((isNaN(dupedValue) || dupedValue <= 0) && itemData.children) {
    const createdAtInfo = dupeItem.info.find(
      (info) => info.title === "Created At",
    );
    const createdYear = createdAtInfo
      ? new Date(createdAtInfo.value).getFullYear().toString()
      : null;

    const matchingChild = createdYear
      ? itemData.children.find(
          (child) =>
            child.sub_name === createdYear &&
            child.data &&
            child.data.duped_value &&
            child.data.duped_value !== "N/A" &&
            child.data.duped_value !== null,
        )
      : null;

    if (matchingChild) {
      dupedValue = parseCurrencyValue(matchingChild.data.duped_value);
    } else {
      // If no matching year found, fall back to first child with valid duped value
      const childWithDupedValue = itemData.children.find(
        (child) =>
          child.data &&
          child.data.duped_value &&
          child.data.duped_value !== "N/A" &&
          child.data.duped_value !== null,
      );

      if (childWithDupedValue) {
        dupedValue = parseCurrencyValue(childWithDupedValue.data.duped_value);
      }
    }
  }

  return isNaN(dupedValue) ? 0 : dupedValue;
};

interface DupeFinderResultsProps {
  initialData: DupeFinderItem[];
  robloxId: string;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  userConnectionData: UserConnectionData | null;
  items: Item[]; // Items data passed from server
}

export default function DupeFinderResults({
  initialData,
  robloxId,
  robloxUsers,
  robloxAvatars,
  userConnectionData,
  items,
}: DupeFinderResultsProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<
    | "duplicates"
    | "alpha-asc"
    | "alpha-desc"
    | "traded-desc"
    | "unique-desc"
    | "created-asc"
    | "created-desc"
  >("duplicates");

  const [localRobloxAvatars, setLocalRobloxAvatars] =
    useState<Record<string, string>>(robloxAvatars);
  const [selectedItem, setSelectedItem] = useState<DupeFinderItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [itemsData] = useState<Item[]>(items);
  const [totalDupedValue, setTotalDupedValue] = useState<number>(0);
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([]);

  // Merge dupe finder data with metadata from item/list endpoint
  // This ensures fields like timesTraded and uniqueCirculation reflect the latest state
  const mergedDupeData = useMemo(
    () => mergeDupeFinderArrayWithMetadata(initialData, itemsData),
    [initialData, itemsData],
  );

  const { user } = useAuthContext();
  const currentUserPremiumType = user?.premiumtype || 0;

  // Initialize ad reloader for route changes
  useAdReloader();

  // Filter out user IDs we already have data for
  const missingUserIds = visibleUserIds.filter(
    (userId) => !robloxUsers[userId],
  );

  // Fetch user data for visible items only using TanStack Query
  const { data: fetchedUserData } = useQuery({
    queryKey: ["userData", [...missingUserIds].sort().join(",")],
    queryFn: () => fetchMissingRobloxData(missingUserIds),
    enabled: missingUserIds.length > 0,
  });

  // Transform data during render instead of using useEffect
  const localRobloxUsers: Record<string, RobloxUser> = (() => {
    if (
      fetchedUserData &&
      "userData" in fetchedUserData &&
      typeof fetchedUserData.userData === "object"
    ) {
      return {
        ...robloxUsers,
        ...fetchedUserData.userData,
      } as Record<string, RobloxUser>;
    }
    return robloxUsers;
  })();

  // Handle visible user IDs changes from virtual scrolling
  const handleVisibleUserIdsChange = useCallback((userIds: string[]) => {
    setVisibleUserIds(userIds);
  }, []);

  // Helper functions
  const getUserDisplay = (userId: string) => {
    const user = localRobloxUsers[userId];
    return user?.name || user?.displayName || userId;
  };

  const getUsername = (userId: string) => {
    const user = localRobloxUsers[userId];
    if (!user) return userId;
    return user.name || userId;
  };

  const getUserAvatar = (userId: string) => {
    return localRobloxAvatars[userId] || "";
  };

  const getHasVerifiedBadge = (userId: string) => {
    const user = localRobloxUsers[userId];
    return Boolean(user?.hasVerifiedBadge);
  };

  // Effects
  useEffect(() => {
    setLocalRobloxAvatars(robloxAvatars);
  }, [robloxAvatars]);

  // Calculate total duped value
  useEffect(() => {
    const calculateTotalDupedValue = () => {
      try {
        let totalDuped = 0;
        const itemMap = new Map(itemsData.map((item) => [item.id, item]));

        mergedDupeData.forEach((dupeItem) => {
          const itemData = itemMap.get(dupeItem.item_id);
          if (itemData) {
            const dupedValue = getDupedValueForItem(itemData, dupeItem);
            if (!isNaN(dupedValue) && dupedValue > 0) {
              totalDuped += dupedValue;
            }
          }
        });

        setTotalDupedValue(totalDuped);
      } catch (error) {
        logError("Error calculating duped value", error, {
          component: "DupeFinderResults",
          action: "calculateTotalDupedValue",
        });
        setTotalDupedValue(0);
      }
    };

    calculateTotalDupedValue();
  }, [mergedDupeData, itemsData]);

  // Filter and sort logic
  const filteredData = (() => {
    return mergedDupeData.filter((item) => {
      const itemData = itemsData.find((data) => data.id === item.item_id);
      if (!itemData) return false;

      const matchesSearch =
        searchTerm === "" ||
        itemData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemData.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.categoryTitle);

      return matchesSearch && matchesCategory;
    });
  })();

  const sortedData = (() => {
    return [...filteredData].sort((a, b) => {
      switch (sortOrder) {
        case "duplicates":
          const aKey = `${a.categoryTitle}-${a.title}`;
          const bKey = `${b.categoryTitle}-${b.title}`;
          const aCount = filteredData.filter(
            (item) => `${item.categoryTitle}-${item.title}` === aKey,
          ).length;
          const bCount = filteredData.filter(
            (item) => `${item.categoryTitle}-${item.title}` === bKey,
          ).length;
          if (aCount > 1 && bCount === 1) return -1;
          if (aCount === 1 && bCount > 1) return 1;
          const itemNameCompare = a.title.localeCompare(b.title);
          if (itemNameCompare !== 0) return itemNameCompare;
          // For items with same name, sort by ID to match duplicate numbering
          return a.id.localeCompare(b.id);
        case "alpha-asc":
          return a.title.localeCompare(b.title);
        case "alpha-desc":
          return b.title.localeCompare(a.title);
        case "traded-desc":
          return b.timesTraded - a.timesTraded;
        case "unique-desc":
          return b.uniqueCirculation - a.uniqueCirculation;
        case "created-asc":
          return a.logged_at - b.logged_at;
        case "created-desc":
          return b.logged_at - a.logged_at;
        default:
          return 0;
      }
    });
  })();

  // Use sortedData directly instead of pagination
  const filteredAndSortedItems = sortedData;

  // Check if there are any duplicates
  const hasDuplicates = (() => {
    const itemCounts = new Map<string, number>();
    filteredData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
    });
    return Array.from(itemCounts.values()).some((count) => count > 1);
  })();

  // Reset sort order if duplicates option is selected but no duplicates exist
  useEffect(() => {
    if (sortOrder === "duplicates" && !hasDuplicates) {
      setSortOrder("created-desc");
    }
  }, [sortOrder, hasDuplicates]);

  // Pre-calculate duplicate counts from FULL inventory (not paginated) for consistent numbering
  const duplicateCounts = (() => {
    const counts = new Map<string, number>();
    mergedDupeData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  })();

  // Use the pre-calculated duplicate counts
  const itemCounts = duplicateCounts;

  const duplicateOrders = (() => {
    const orders = new Map<string, number>();
    const itemGroups = new Map<string, DupeFinderItem[]>();

    // Group items by name using ALL items from full inventory
    mergedDupeData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item);
    });

    // Sort each group by ID for consistent ordering and assign order numbers
    itemGroups.forEach((items) => {
      if (items.length > 1) {
        // Sort by ID for consistent ordering (each item has unique ID)
        const sortedItems = items.sort((a, b) => {
          return a.id.localeCompare(b.id);
        });

        sortedItems.forEach((item, index) => {
          orders.set(item.id, index + 1);
        });
      }
    });

    return orders;
  })();

  // Event handlers
  const handleCardClick = (item: DupeFinderItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <DupeSearchInput initialValue={robloxId} />

      {/* User Info */}
      <div
        className={`grid gap-6 ${currentUserPremiumType === 0 || currentUserPremiumType > 3 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        <div
          className={`${currentUserPremiumType === 0 || currentUserPremiumType > 3 ? "lg:col-span-2" : ""}`}
        >
          <DupeUserInfo
            robloxId={robloxId}
            userConnectionData={userConnectionData}
            getUserDisplay={getUserDisplay}
            getUsername={getUsername}
            getUserAvatar={getUserAvatar}
            getHasVerifiedBadge={getHasVerifiedBadge}
            dupeItemsCount={mergedDupeData.length}
            totalDupedValue={totalDupedValue}
          />
        </div>

        {/* Ad - Takes up 1/3 of the space, only show for non-premium users (premium types 1-3 are valid) */}
        {(currentUserPremiumType === 0 || currentUserPremiumType > 3) && (
          <div className="flex flex-col items-center lg:col-span-1">
            <span className="text-secondary-text mb-2 block text-center text-xs">
              ADVERTISEMENT
            </span>
            <div
              className="relative h-full overflow-hidden rounded-lg transition-all duration-300"
              style={{ minHeight: "250px" }}
            >
              <DisplayAd
                adSlot="9566904102"
                adFormat="auto"
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </div>
            <AdRemovalNotice className="mt-2" />
          </div>
        )}
      </div>

      {/* Filters */}
      <DupeFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        sortOrder={sortOrder}
        setSortOrder={(order) => setSortOrder(order as typeof sortOrder)}
        initialData={initialData}
        hasDuplicates={hasDuplicates}
      />

      {/* Items Grid */}
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
        <h2 className="text-primary-text mb-4 text-xl font-semibold">
          Duplicate Items
        </h2>

        {/* Pro Tip - Only show when there are results */}
        {sortedData.length > 0 && (
          <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-3">
            <div className="text-primary-text flex items-start gap-2 text-sm">
              <Icon
                icon="emojione:light-bulb"
                className="text-button-info flex-shrink-0 text-lg"
              />
              <span className="font-medium">
                Pro Tip: Click on any item card to view its ownership history.
              </span>
            </div>
          </div>
        )}

        <DupeItemsGrid
          filteredItems={filteredAndSortedItems}
          getUserDisplay={getUserDisplay}
          getUserAvatar={getUserAvatar}
          getHasVerifiedBadge={getHasVerifiedBadge}
          getDupedValueForItem={getDupedValueForItem}
          onCardClick={handleCardClick}
          itemCounts={itemCounts}
          duplicateOrders={duplicateOrders}
          itemsData={itemsData}
          onVisibleUserIdsChange={handleVisibleUserIdsChange}
        />
      </div>

      {/* Modals */}
      {showHistoryModal && selectedItem && (
        <TradeHistoryModal
          isOpen={showHistoryModal}
          onClose={closeHistoryModal}
          item={selectedItem}
        />
      )}
    </div>
  );
}
