"use client";

import { useState, useEffect, useMemo } from "react";
import { DupeFinderItem, RobloxUser, Item } from "@/types";
import { UserConnectionData } from "@/app/inventories/types";
import { useBatchUserData } from "@/hooks/useBatchUserData";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import { Icon } from "../ui/IconWrapper";
import { logError } from "@/services/logger";
import DupeUserInfo from "./DupeUserInfo";
import DupeFilters from "./DupeFilters";
import DupeItemsGrid from "./DupeItemsGrid";
import DupeSearchInput from "./DupeSearchInput";
import { mergeDupeFinderArrayWithMetadata } from "@/utils/inventoryMerge";
import { getDupedValueForItem } from "@/utils/dupeUtils";

interface DupeFinderResultsProps {
  initialData: DupeFinderItem[];
  robloxId: string;
  robloxUsers: Record<string, RobloxUser>;
  userConnectionData: UserConnectionData | null;
  items: Item[]; // Items data passed from server
}

export default function DupeFinderResults({
  initialData,
  robloxId,
  robloxUsers,
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
    | "created-asc"
    | "created-desc"
    | "duped-desc"
    | "duped-asc"
  >("duplicates");

  const [selectedItem, setSelectedItem] = useState<DupeFinderItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [itemsData] = useState<Item[]>(items);
  const [totalDupedValue, setTotalDupedValue] = useState<number>(0);

  // Merge dupe finder data with metadata from item/list endpoint
  // This ensures fields like timesTraded and uniqueCirculation reflect the latest state
  const mergedDupeData = useMemo(
    () => mergeDupeFinderArrayWithMetadata(initialData, itemsData),
    [initialData, itemsData],
  );

  // Extract all unique user IDs from dupe data
  // Only extract main user ID and original owners (no longer fetching current owners)
  const allUserIds = useMemo(() => {
    const userIds = new Set<string>();

    // Add main user
    userIds.add(robloxId);

    // Add original owners only (for modals/history)
    mergedDupeData.forEach((item) => {
      // Get original owner from info array
      const originalOwnerInfo = item.info?.find(
        (info) => info.title === "Original Owner",
      );
      if (originalOwnerInfo?.value && /^\d+$/.test(originalOwnerInfo.value)) {
        userIds.add(originalOwnerInfo.value);
      }
    });

    return Array.from(userIds);
  }, [mergedDupeData, robloxId]);

  // Use batch fetcher to progressively load user data
  const { robloxUsers: batchedUsers } = useBatchUserData(allUserIds);

  // Merge initial users with batched users
  const localRobloxUsers: Record<string, RobloxUser> = {
    ...robloxUsers,
    ...batchedUsers,
  };

  // Helper functions
  const getUserDisplay = (userId: string) => {
    const user = localRobloxUsers[userId];
    return user?.displayName || user?.name || userId;
  };

  const getUsername = (userId: string) => {
    const user = localRobloxUsers[userId];
    if (!user) return userId;
    return user.name || userId;
  };

  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  const getHasVerifiedBadge = (userId: string) => {
    const user = localRobloxUsers[userId];
    return Boolean(user?.hasVerifiedBadge);
  };

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

      let matchesSearch = searchTerm === "";

      if (searchTerm.trim()) {
        const normalize = (str: string) =>
          str.toLowerCase().replace(/[^a-z0-9]/g, "");
        const tokenize = (str: string) =>
          str.toLowerCase().match(/[a-z0-9]+/g) || [];
        const splitAlphaNum = (str: string) => {
          return (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) =>
            s.toLowerCase(),
          );
        };

        const searchNormalized = normalize(searchTerm);
        const searchTokens = tokenize(searchTerm);
        const searchAlphaNum = splitAlphaNum(searchTerm);

        function isTokenSubsequence(
          searchTokens: string[],
          nameTokens: string[],
        ) {
          let i = 0,
            j = 0;
          while (i < searchTokens.length && j < nameTokens.length) {
            if (nameTokens[j].includes(searchTokens[i])) {
              i++;
            }
            j++;
          }
          return i === searchTokens.length;
        }

        const nameNormalized = normalize(itemData.name);
        const typeNormalized = normalize(itemData.type);
        const categoryNormalized = normalize(item.categoryTitle);
        const nameTokens = tokenize(itemData.name);
        const nameAlphaNum = splitAlphaNum(itemData.name);
        const categoryTokens = tokenize(item.categoryTitle);
        const categoryAlphaNum = splitAlphaNum(item.categoryTitle);

        matchesSearch =
          nameNormalized.includes(searchNormalized) ||
          typeNormalized.includes(searchNormalized) ||
          categoryNormalized.includes(searchNormalized) ||
          isTokenSubsequence(searchTokens, nameTokens) ||
          isTokenSubsequence(searchAlphaNum, nameAlphaNum) ||
          isTokenSubsequence(searchTokens, categoryTokens) ||
          isTokenSubsequence(searchAlphaNum, categoryAlphaNum);
      }

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.categoryTitle);

      return matchesSearch && matchesCategory;
    });
  })();

  // Check if there are any duplicates
  const hasDuplicates = (() => {
    const itemCounts = new Map<string, number>();
    filteredData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
    });
    return Array.from(itemCounts.values()).some((count) => count > 1);
  })();

  // Derive effective sort order (fall back if duplicates is selected but none exist)
  const effectiveSortOrder =
    sortOrder === "duplicates" && !hasDuplicates ? "created-desc" : sortOrder;

  const sortedData = (() => {
    return [...filteredData].sort((a, b) => {
      switch (effectiveSortOrder) {
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
        case "created-asc":
          return a.logged_at - b.logged_at;
        case "created-desc":
          return b.logged_at - a.logged_at;
        case "duped-desc": {
          const aItemData = itemsData.find((data) => data.id === a.item_id);
          const bItemData = itemsData.find((data) => data.id === b.item_id);
          const aDupedValue = aItemData
            ? getDupedValueForItem(aItemData, a)
            : 0;
          const bDupedValue = bItemData
            ? getDupedValueForItem(bItemData, b)
            : 0;
          return bDupedValue - aDupedValue;
        }
        case "duped-asc": {
          const aItemData = itemsData.find((data) => data.id === a.item_id);
          const bItemData = itemsData.find((data) => data.id === b.item_id);
          const aDupedValue = aItemData
            ? getDupedValueForItem(aItemData, a)
            : 0;
          const bDupedValue = bItemData
            ? getDupedValueForItem(bItemData, b)
            : 0;
          return aDupedValue - bDupedValue;
        }
        default:
          return 0;
      }
    });
  })();

  // Use sortedData directly instead of pagination
  const filteredAndSortedItems = sortedData;

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

        {/* Item Counter */}
        <div className="mb-4">
          <p className="text-secondary-text">
            {searchTerm || selectedCategories.length > 0
              ? `Found ${filteredAndSortedItems.length} ${filteredAndSortedItems.length === 1 ? "item" : "items"}${
                  searchTerm ? ` matching "${searchTerm}"` : ""
                }${selectedCategories.length > 0 ? ` in ${selectedCategories[0]}` : ""}`
              : `Total Items: ${filteredAndSortedItems.length}`}
          </p>
        </div>

        {/* Helpful Tip - Only show when there are results */}
        {sortedData.length > 0 && (
          <div className="bg-button-info/10 border-button-info mb-4 rounded-lg border p-3">
            <div className="text-primary-text flex items-start gap-2 text-sm">
              <Icon
                icon="emojione:light-bulb"
                className="text-button-info shrink-0 text-lg"
              />
              <span className="font-medium">
                Helpful Tip: Click on any item card to view its ownership
                history. If you suspect an item is a false dupe, click the
                &quot;Compare Variants&quot; button inside the ownership history
                modal.
              </span>
            </div>
          </div>
        )}

        <DupeItemsGrid
          filteredItems={filteredAndSortedItems}
          getUserAvatar={getUserAvatar}
          getUsername={getUsername}
          getDupedValueForItem={getDupedValueForItem}
          onCardClick={handleCardClick}
          itemCounts={itemCounts}
          duplicateOrders={duplicateOrders}
          itemsData={itemsData}
          robloxId={robloxId}
        />
      </div>

      {/* Modals */}
      {showHistoryModal && selectedItem && (
        <TradeHistoryModal
          isOpen={showHistoryModal}
          onClose={closeHistoryModal}
          item={selectedItem}
          username={robloxId ? getUsername(robloxId) : undefined}
        />
      )}
    </div>
  );
}
