"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RobloxUser, Item, ValueSort } from "@/types";
import { InventoryData, InventoryItem } from "@/app/inventories/types";
import InventoryFilters, { type InventorySortGroup } from "./InventoryFilters";
import InventoryItemsGrid from "./InventoryItemsGrid";
import { Icon } from "../ui/IconWrapper";
import { mergeInventoryArrayWithMetadata } from "@/utils/trading/inventoryMerge";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import { sortByValueSort } from "@/utils/trading/values";
import { usePartialItems, useCatalogValues } from "@/hooks/usePartialItems";
import { useItemSortGroups } from "@/hooks/useItemSortGroups";

interface InventoryItemsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  onItemClick: (item: InventoryItem) => void;
  itemsData?: Item[];
  isOwnInventory?: boolean;
  onShowOnlyOriginalChange?: (val: boolean) => void;
  onShowOnlyNonOriginalChange?: (val: boolean) => void;
  onShowOnlyLimitedChange?: (val: boolean) => void;
  onShowOnlySeasonalChange?: (val: boolean) => void;
}

const DATE_SORT_GROUP: InventorySortGroup = {
  label: "Date",
  options: [
    { value: "created-desc", label: "Newest First" },
    { value: "created-asc", label: "Oldest First" },
  ],
};
const SNAPSHOT_SORTS = new Set([
  "created-desc",
  "created-asc",
  "alpha-asc",
  "alpha-desc",
  "random",
  "unique-circulation-desc",
  "unique-circulation-asc",
  "season-number-asc",
  "season-number-desc",
  "season-level-asc",
  "season-level-desc",
]);
const UNSUPPORTED_SORT_GROUPS = new Set(["Last Updated"]);

const snapshotValue = (item: InventoryItem, field: string) =>
  item.info.find((entry) => entry.title === field)?.value ?? null;

export default function InventoryItems({
  initialData,
  robloxUsers,
  onItemClick,
  itemsData: propItemsData,
  onShowOnlyOriginalChange,
  onShowOnlyNonOriginalChange,
  onShowOnlyLimitedChange,
  onShowOnlySeasonalChange,
}: InventoryItemsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyOriginal, setShowOnlyOriginal] = useState(false);
  const [showOnlyNonOriginal, setShowOnlyNonOriginal] = useState(false);
  const [showOnlySigned, setShowOnlySigned] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [showMissingItems, setShowMissingItems] = useState(false);
  const [showOnlyLimited, setShowOnlyLimited] = useState(false);
  const [showOnlySeasonal, setShowOnlySeasonal] = useState(false);
  const [showOnlyTradable, setShowOnlyTradable] = useState(false);
  const [showOnlyUntradable, setShowOnlyUntradable] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const [sortOrder, setSortOrder] = useState("created-desc");
  const itemSortGroups = useItemSortGroups();
  const sortGroups = useMemo(
    () => [
      DATE_SORT_GROUP,
      ...itemSortGroups.filter(
        (group) => !UNSUPPORTED_SORT_GROUPS.has(group.label),
      ),
    ],
    [itemSortGroups],
  );

  // Merge inventory data with metadata from item/list endpoint
  // This ensures fields like timesTraded and uniqueCirculation
  // reflect the latest state from metadata, not stale snapshots
  // Also include duplicates from the API response
  // Track which items come from duplicates array for visual indication
  const mergedInventoryData = useMemo(() => {
    const regularItems = initialData.data || [];
    const duplicateItems = initialData.duplicates || [];
    const allItems = [...regularItems, ...duplicateItems];
    const merged = mergeInventoryArrayWithMetadata(
      allItems,
      propItemsData || [],
    );

    // Mark items from duplicates array
    const duplicateItemIds = new Set(duplicateItems.map((item) => item.id));
    return merged.map((item) => ({
      ...item,
      _isDupedItem: duplicateItemIds.has(item.id),
    }));
  }, [initialData.data, initialData.duplicates, propItemsData]);

  const handleCardClick = (item: InventoryItem) => {
    onItemClick(item);
  };

  const handleOriginalFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setShowOnlyOriginal(true);
      setShowOnlyNonOriginal(false);
      setShowMissingItems(false);
      onShowOnlyOriginalChange?.(true);
      onShowOnlyNonOriginalChange?.(false);
    } else {
      setShowOnlyOriginal(false);
      onShowOnlyOriginalChange?.(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleNonOriginalFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setShowOnlyNonOriginal(true);
      setShowOnlyOriginal(false);
      setShowMissingItems(false);
      onShowOnlyNonOriginalChange?.(true);
      onShowOnlyOriginalChange?.(false);
    } else {
      setShowOnlyNonOriginal(false);
      onShowOnlyNonOriginalChange?.(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleSignedFilterToggle = (checked: boolean) => {
    setShowOnlySigned(checked);
    if (checked) setShowMissingItems(false);
  };

  const handleHideDuplicatesToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setHideDuplicates(true);
      setShowMissingItems(false);
    } else {
      setHideDuplicates(false);
      setShowOnlyLimited(false);
      setShowOnlySeasonal(false);
      setShowOnlyTradable(false);
      setShowOnlyUntradable(false);
      onShowOnlyLimitedChange?.(false);
      onShowOnlySeasonalChange?.(false);
      if (sortOrder.startsWith("cash-") || sortOrder.startsWith("duped-")) {
        setSortOrder("alpha-asc");
      }
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleShowMissingItemsToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setShowMissingItems(true);
      setShowOnlyOriginal(false);
      setShowOnlyNonOriginal(false);
      setShowOnlySigned(false);
      setHideDuplicates(false);
    } else {
      setShowMissingItems(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleLimitedFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    setShowOnlyLimited(checked);
    onShowOnlyLimitedChange?.(checked);
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleSeasonalFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    setShowOnlySeasonal(checked);
    onShowOnlySeasonalChange?.(checked);
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleTradableFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setShowOnlyTradable(true);
      setShowOnlyUntradable(false);
    } else {
      setShowOnlyTradable(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleUntradableFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setShowOnlyUntradable(true);
      setShowOnlyTradable(false);
    } else {
      setShowOnlyUntradable(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const currentItemsData = useMemo(() => propItemsData || [], [propItemsData]);
  const partialItemsQuery = usePartialItems(showMissingItems);
  const metadataFilterActive =
    (showOnlyLimited ||
      showOnlySeasonal ||
      showOnlyTradable ||
      showOnlyUntradable) &&
    !showMissingItems;
  const catalogValuesQuery = useCatalogValues(
    metadataFilterActive || !SNAPSHOT_SORTS.has(sortOrder),
  );
  const catalogValuesById = useMemo(
    () =>
      new Map((catalogValuesQuery.data ?? []).map((item) => [item.id, item])),
    [catalogValuesQuery.data],
  );
  const catalogById = useMemo(
    () => new Map(currentItemsData.map((item) => [item.id, item])),
    [currentItemsData],
  );

  const getUserDisplay = (userId: string) => {
    const user = robloxUsers[userId];
    if (!user) return userId;
    return user.name || user.displayName || userId;
  };

  const getUserAvatar = (userId: string) => {
    return `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/${userId}/avatar-headshot`;
  };

  const getHasVerifiedBadge = (userId: string) => {
    const user = robloxUsers[userId];
    return Boolean(user?.hasVerifiedBadge);
  };

  // Count duplicates across entire inventory for consistent numbering
  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    mergedInventoryData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [mergedInventoryData]);

  // Recalculate counts when hiding duplicates
  const filteredDuplicateCounts = useMemo(() => {
    if (!hideDuplicates) return duplicateCounts;

    const counts = new Map<string, number>();
    const seenItems = new Set<string>();

    mergedInventoryData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      if (!seenItems.has(key)) {
        seenItems.add(key);
        counts.set(key, 1);
      }
    });
    return counts;
  }, [hideDuplicates, duplicateCounts, mergedInventoryData]);

  // Filter and sort logic
  const filteredAndSortedItems = useMemo(() => {
    const getLatestTime = (item: InventoryItem) => {
      if (item.history && item.history.length > 0) {
        const maxHistoryTime = Math.max(
          ...item.history.map((h) => h.TradeTime),
        );
        return maxHistoryTime * 1000;
      }
      return 0;
    };

    const sortEntries = <E extends { item: InventoryItem }>(entries: E[]) => {
      if (sortOrder === "created-asc" || sortOrder === "created-desc") {
        const direction = sortOrder === "created-asc" ? 1 : -1;
        return [...entries].sort(
          (a, b) => (getLatestTime(a.item) - getLatestTime(b.item)) * direction,
        );
      }
      const keyed = entries.map((entry) => {
        const values = catalogValuesById.get(entry.item.item_id);
        return {
          entry,
          name: entry.item.title,
          season: entry.item.season,
          level: entry.item.level,
          cash_value: values
            ? values.cash_value
            : snapshotValue(entry.item, "Cash Value"),
          duped_value: values
            ? values.duped_value
            : snapshotValue(entry.item, "Duped Value"),
          demand: values?.demand ?? null,
          trend: values?.trend ?? null,
          uniqueCirculation: entry.item.uniqueCirculation,
        };
      });
      return sortByValueSort(keyed, sortOrder as ValueSort, {
        getUniqueCirculation: (key) => key.uniqueCirculation,
        fallbackSortForDemandTrend: "none",
      }).map((key) => key.entry);
    };

    if (showMissingItems) {
      const ownedItemIds = new Set(
        mergedInventoryData.map((item) => item.item_id),
      );

      /*
       * Items that bots don't log - exclude from missing items:
       * 142: Camaro
       * 467: Heli
       * 171: Jeep
       * 640: VIP Chrome
       * 634: VIP Radio
       * 152: Cruiser
       */
      const excludedItemIds = new Set([142, 467, 171, 640, 634, 152]);

      const missingItems = (partialItemsQuery.data ?? []).filter((itemData) => {
        if (ownedItemIds.has(itemData.id)) {
          return false;
        }

        // Skip items that bots don't log
        if (excludedItemIds.has(itemData.id)) {
          return false;
        }
        if (
          searchTerm &&
          !matchesTextSearch([itemData.name, itemData.type], searchTerm)
        ) {
          return false;
        }
        if (selectedCategories.length > 0) {
          if (!selectedCategories.includes(itemData.type)) {
            return false;
          }
        }

        // For missing items, we don't filter by original/non-original since the user doesn't own them
        // These filters are disabled when showMissingItems is true

        return true;
      });

      const mappedMissingItems = missingItems.map((itemData) => {
        // mock inventory item for missing items
        const mockInventoryItem = {
          item_id: itemData.id,
          categoryTitle: itemData.type,
          title: itemData.name,
          id: `missing-${itemData.id}`, // Unique ID for missing items
          info: [
            { title: "Cash Value", value: "N/A" },
            { title: "Duped Value", value: "N/A" },
            { title: "Original Owner", value: "???" },
            { title: "Created At", value: "???" },
          ],
          isOriginalOwner: false,
          timesTraded: 0,
          uniqueCirculation: 0,
          scan_id: "",
          is_duplicated: false,
          level: null,
          season: null,
          tradePopularMetric: null,
          history: [],
        };

        return {
          item: mockInventoryItem,
          itemData: undefined as Item | undefined,
          name: itemData.name,
        };
      });

      return sortOrder === "created-asc" || sortOrder === "created-desc"
        ? [...mappedMissingItems].sort((a, b) => a.name.localeCompare(b.name))
        : sortEntries(mappedMissingItems);
    }

    // Original logic for showing owned items
    const filtered = mergedInventoryData.filter((item) => {
      const itemData = catalogValuesById.get(item.item_id);

      // Search filter
      if (
        searchTerm &&
        !matchesTextSearch([item.title, item.categoryTitle], searchTerm)
      ) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(item.categoryTitle)) {
          return false;
        }
      }

      // Original owner filter
      if (showOnlyOriginal) {
        if (!item.isOriginalOwner) {
          return false;
        }
      } else if (showOnlyNonOriginal) {
        if (item.isOriginalOwner) {
          return false;
        }
      }

      if (showOnlySigned && !item.Sign?.some(Boolean)) return false;

      if (showOnlyLimited && itemData?.is_limited !== 1) return false;
      if (showOnlySeasonal && itemData?.is_seasonal !== 1) return false;

      // Filter by tradability
      if (showOnlyTradable) {
        if (itemData?.tradable !== 1) {
          return false;
        }
      } else if (showOnlyUntradable) {
        if (itemData?.tradable !== 0) {
          return false;
        }
      }

      return true;
    });

    // Apply hide duplicates filter
    let finalFiltered = filtered;
    if (hideDuplicates) {
      const seenItems = new Set<string>();
      finalFiltered = filtered.filter((item) => {
        const itemKey = `${item.categoryTitle}-${item.title}`;
        if (seenItems.has(itemKey)) {
          return false; // Skip this duplicate
        }
        seenItems.add(itemKey);
        return true; // Keep the first occurrence
      });
    }

    const mappedItems = finalFiltered.map((item) => {
      const baseItemData = catalogById.get(item.item_id);

      return {
        item,
        itemData: baseItemData,
        isDupedItem:
          (item as InventoryItem & { _isDupedItem?: boolean })._isDupedItem ||
          false,
      };
    });

    return sortEntries(mappedItems);
  }, [
    showMissingItems,
    mergedInventoryData,
    partialItemsQuery.data,
    catalogById,
    catalogValuesById,
    searchTerm,
    selectedCategories,
    showOnlyLimited,
    showOnlySeasonal,
    showOnlyTradable,
    showOnlyUntradable,
    showOnlyOriginal,
    showOnlyNonOriginal,
    showOnlySigned,
    hideDuplicates,
    sortOrder,
  ]);

  // Use the pre-calculated duplicate counts from full inventory
  const itemCounts = hideDuplicates ? filteredDuplicateCounts : duplicateCounts;

  // Create a map to track the order of duplicates based on creation date (using ALL items from full inventory)
  const duplicateOrders = useMemo(() => {
    const orders = new Map<string, number>();

    // Group items by name using ALL items from full inventory
    const itemGroups = new Map<string, InventoryItem[]>();
    mergedInventoryData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item);
    });

    // Sort each group by ID for consistent ordering and assign numbers
    itemGroups.forEach((items) => {
      if (items.length > 1) {
        // Sort by ID for consistent ordering (each item has unique ID)
        const sortedItems = items.sort((a, b) => {
          return a.id.localeCompare(b.id);
        });

        // Assign numbers starting from 1
        sortedItems.forEach((item, index) => {
          // Use a unique key that combines id and other unique properties to handle items with same id
          const uniqueKey = `${item.id}-${item.timesTraded}-${item.uniqueCirculation}`;
          orders.set(uniqueKey, index + 1);
        });
      }
    });

    return orders;
  }, [mergedInventoryData]);

  // Available categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    const source = showMissingItems
      ? (partialItemsQuery.data ?? []).map((item) => item.type)
      : mergedInventoryData.map((item) => item.categoryTitle);
    source.forEach((category) => {
      if (category) {
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  }, [mergedInventoryData, partialItemsQuery.data, showMissingItems]);

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
      <h2 className="text-primary-text mb-4 text-xl font-semibold">
        Inventory Items
      </h2>

      {/* Filters */}
      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        showOnlyOriginal={showOnlyOriginal}
        showOnlyNonOriginal={showOnlyNonOriginal}
        showOnlySigned={showOnlySigned}
        hideDuplicates={hideDuplicates}
        showMissingItems={showMissingItems}
        showOnlyLimited={showOnlyLimited}
        showOnlySeasonal={showOnlySeasonal}
        showOnlyTradable={showOnlyTradable}
        showOnlyUntradable={showOnlyUntradable}
        availableCategories={availableCategories}
        onFilterToggle={handleOriginalFilterToggle}
        onNonOriginalFilterToggle={handleNonOriginalFilterToggle}
        onSignedFilterToggle={handleSignedFilterToggle}
        onHideDuplicatesToggle={handleHideDuplicatesToggle}
        onShowMissingItemsToggle={handleShowMissingItemsToggle}
        onLimitedFilterToggle={handleLimitedFilterToggle}
        onSeasonalFilterToggle={handleSeasonalFilterToggle}
        onTradableFilterToggle={handleTradableFilterToggle}
        onUntradableFilterToggle={handleUntradableFilterToggle}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortGroups={sortGroups}
      />

      {/* Item Counter */}
      <div className="mb-4">
        <p className="text-secondary-text">
          {searchTerm ||
          showOnlyOriginal ||
          showOnlyNonOriginal ||
          showOnlySigned ||
          hideDuplicates ||
          showMissingItems ||
          showOnlyLimited ||
          showOnlySeasonal ||
          showOnlyTradable ||
          showOnlyUntradable ||
          selectedCategories.length > 0
            ? `Found ${filteredAndSortedItems.length} ${filteredAndSortedItems.length === 1 ? "item" : "items"}${
                searchTerm ? ` matching "${searchTerm}"` : ""
              }${
                showOnlyOriginal
                  ? " (Original only)"
                  : showOnlyNonOriginal
                    ? " (Non-original only)"
                    : ""
              }${hideDuplicates ? " (Duplicates hidden)" : ""}${
                showMissingItems ? " (Missing items)" : ""
              }${showOnlySigned ? " (Autographed only)" : ""}${showOnlyLimited ? " (Limited only)" : ""}${showOnlySeasonal ? " (Seasonal only)" : ""}${showOnlyTradable ? " (Tradable only)" : ""}${
                showOnlyUntradable ? " (Untradable only)" : ""
              }${selectedCategories.length > 0 ? ` in ${selectedCategories[0]}` : ""}`
            : `Total Items: ${filteredAndSortedItems.length}`}
        </p>
      </div>

      {/* Items Grid */}
      {/* Helpful Tip - Only show when there are results and not filtering */}
      {!isFiltering && filteredAndSortedItems.length > 0 && (
        <div className="bg-button-info/10 border-button-info mb-4 rounded-lg border p-3">
          <div className="text-primary-text flex items-start gap-2 text-sm">
            <Icon
              icon="emojione:light-bulb"
              className="text-button-info shrink-0 text-lg"
            />
            <span className="font-medium">
              To check if an item is duped, please use our{" "}
              <Link href="/dupes" className="font-bold underline">
                Dupe Finder
              </Link>
              .
            </span>
          </div>
        </div>
      )}

      {catalogValuesQuery.isError && !catalogValuesQuery.data ? (
        <div className="text-secondary-text py-8 text-center">
          Couldn&apos;t load item values for this filter or sort.{" "}
          <button
            type="button"
            className="text-link underline"
            onClick={() => void catalogValuesQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : showMissingItems &&
        partialItemsQuery.isError &&
        !partialItemsQuery.data ? (
        <div className="text-secondary-text py-8 text-center">
          Couldn&apos;t load the missing-item list.{" "}
          <button
            type="button"
            className="text-link underline"
            onClick={() => void partialItemsQuery.refetch()}
          >
            Try again
          </button>
        </div>
      ) : (
        <InventoryItemsGrid
          filteredItems={filteredAndSortedItems}
          getUserDisplay={getUserDisplay}
          getUserAvatar={getUserAvatar}
          getHasVerifiedBadge={getHasVerifiedBadge}
          onCardClick={handleCardClick}
          isLoading={
            isFiltering ||
            (showMissingItems && partialItemsQuery.isPending) ||
            catalogValuesQuery.isLoading
          }
          userId={initialData.user_id}
          itemCounts={itemCounts}
          duplicateOrders={duplicateOrders}
        />
      )}

      {/* Action Modal */}
    </div>
  );
}
