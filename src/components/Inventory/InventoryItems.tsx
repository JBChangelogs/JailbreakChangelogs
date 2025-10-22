"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RobloxUser, Item } from "@/types";
import { InventoryData, InventoryItem } from "@/app/inventories/types";
import ItemActionModal from "@/components/Modals/ItemActionModal";
import InventoryFilters from "./InventoryFilters";
import InventoryItemsGrid from "./InventoryItemsGrid";
import { Icon } from "../UI/IconWrapper";
import dynamic from "next/dynamic";
import { fetchMissingRobloxData } from "@/app/inventories/actions";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface InventoryItemsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  onItemClick: (item: InventoryItem) => void;
  itemsData?: Item[];
  isOwnInventory?: boolean;
}

export default function InventoryItems({
  initialData,
  robloxUsers,
  robloxAvatars,
  onItemClick,
  itemsData: propItemsData,
  isOwnInventory = false,
}: InventoryItemsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyOriginal, setShowOnlyOriginal] = useState(false);
  const [showOnlyNonOriginal, setShowOnlyNonOriginal] = useState(false);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [showMissingItems, setShowMissingItems] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [localRobloxUsers, setLocalRobloxUsers] =
    useState<Record<string, RobloxUser>>(robloxUsers);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] =
    useState<InventoryItem | null>(null);
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<
    | "duplicates"
    | "alpha-asc"
    | "alpha-desc"
    | "created-asc"
    | "created-desc"
    | "cash-desc"
    | "cash-asc"
    | "duped-desc"
    | "duped-asc"
  >("created-desc");

  // Fetch user data for visible items only using TanStack Query
  const { data: fetchedUserData } = useQuery({
    queryKey: ["userData", visibleUserIds.sort()],
    queryFn: () => fetchMissingRobloxData(visibleUserIds),
    enabled: visibleUserIds.length > 0,
  });

  // Merge fetched user data with existing data
  useEffect(() => {
    if (fetchedUserData && "userData" in fetchedUserData) {
      setTimeout(() => {
        setLocalRobloxUsers((prev) => ({
          ...prev,
          ...fetchedUserData.userData,
        }));
      }, 0);
      // Note: avatarData is empty for original owners since they're not displayed
    }
  }, [fetchedUserData]);

  // Handle visible user IDs changes from virtual scrolling
  const handleVisibleUserIdsChange = useCallback((userIds: string[]) => {
    setVisibleUserIds(userIds);
  }, []);

  // Get variant-specific values (e.g., different hyperchrome colors by year)
  const getVariantSpecificValues = (
    item: InventoryItem,
    baseItemData: Item,
  ) => {
    // Match variant by creation year
    if (baseItemData.children && baseItemData.children.length > 0) {
      const createdAtInfo = item.info.find(
        (info) => info.title === "Created At",
      );
      const createdYear = createdAtInfo
        ? new Date(createdAtInfo.value).getFullYear().toString()
        : null;

      const matchingChild = createdYear
        ? baseItemData.children.find(
            (child) =>
              child.sub_name === createdYear &&
              child.data &&
              child.data.cash_value &&
              child.data.cash_value !== "N/A" &&
              child.data.cash_value !== null,
          )
        : null;

      if (matchingChild) {
        return {
          cash_value: matchingChild.data.cash_value,
          duped_value: matchingChild.data.duped_value,
        };
      }
    }

    // Use base item values if no variant match
    return {
      cash_value: baseItemData.cash_value,
      duped_value: baseItemData.duped_value,
    };
  };

  const handleCardClick = (item: InventoryItem) => {
    setSelectedItemForAction(item);
    setShowActionModal(true);
  };

  const handleViewTradeHistory = () => {
    if (selectedItemForAction) {
      onItemClick(selectedItemForAction);
    }
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedItemForAction(null);
  };

  const handleOriginalFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setShowOnlyOriginal(true);
      setShowOnlyNonOriginal(false);
      setShowMissingItems(false);
    } else {
      setShowOnlyOriginal(false);
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
    } else {
      setShowOnlyNonOriginal(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const handleHideDuplicatesToggle = (checked: boolean) => {
    setIsFiltering(true);
    if (checked) {
      setHideDuplicates(true);
      setShowMissingItems(false);
    } else {
      setHideDuplicates(false);
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
      setHideDuplicates(false);
    } else {
      setShowMissingItems(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  const currentItemsData = useMemo(() => propItemsData || [], [propItemsData]);
  const currentRobloxUsers = useMemo(
    () => ({ ...robloxUsers, ...localRobloxUsers }),
    [robloxUsers, localRobloxUsers],
  );
  const currentRobloxAvatars = robloxAvatars;

  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = currentRobloxUsers[userId];
      if (!user) return userId;
      return user.name || user.displayName || userId;
    },
    [currentRobloxUsers],
  );

  const getUserAvatar = useCallback(
    (userId: string) => {
      return currentRobloxAvatars[userId] || "";
    },
    [currentRobloxAvatars],
  );

  const getHasVerifiedBadge = useCallback(
    (userId: string) => {
      const user = currentRobloxUsers[userId];
      return Boolean(user?.hasVerifiedBadge);
    },
    [currentRobloxUsers],
  );

  // Count duplicates across entire inventory for consistent numbering
  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    initialData.data.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [initialData.data]);

  // Recalculate counts when hiding duplicates
  const filteredDuplicateCounts = useMemo(() => {
    if (!hideDuplicates) return duplicateCounts;

    const counts = new Map<string, number>();
    const seenItems = new Set<string>();

    initialData.data.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      if (!seenItems.has(key)) {
        seenItems.add(key);
        counts.set(key, 1);
      }
    });
    return counts;
  }, [initialData.data, hideDuplicates, duplicateCounts]);

  // Parse values like "23.4m" -> 23400000
  const parseNumericValue = (value: string | null): number => {
    if (!value || value === "N/A") return -1;
    const lower = value.toLowerCase();
    const num = parseFloat(lower.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(num)) return -1;
    if (lower.includes("k")) return num * 1_000;
    if (lower.includes("m")) return num * 1_000_000;
    if (lower.includes("b")) return num * 1_000_000_000;
    return num;
  };

  // Filter and sort logic
  const filteredAndSortedItems = useMemo(() => {
    if (showMissingItems) {
      const ownedItemIds = new Set(
        initialData.data.map((item) => item.item_id),
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

      const missingItems = currentItemsData.filter((itemData) => {
        if (ownedItemIds.has(itemData.id)) {
          return false;
        }

        // Skip items that bots don't log
        if (excludedItemIds.has(itemData.id)) {
          return false;
        }
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          if (
            !itemData.name.toLowerCase().includes(searchLower) &&
            !itemData.type.toLowerCase().includes(searchLower) &&
            !itemData.creator.toLowerCase().includes(searchLower)
          ) {
            return false;
          }
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
            { title: "Cash Value", value: itemData.cash_value || "N/A" },
            { title: "Duped Value", value: itemData.duped_value || "N/A" },
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
          itemData: itemData,
        };
      });

      // Sort missing items
      return [...mappedMissingItems].sort((a, b) => {
        switch (sortOrder) {
          case "alpha-asc":
            return a.itemData.name.localeCompare(b.itemData.name);
          case "alpha-desc":
            return b.itemData.name.localeCompare(a.itemData.name);
          case "cash-desc":
            const aCashDesc = parseNumericValue(a.itemData.cash_value);
            const bCashDesc = parseNumericValue(b.itemData.cash_value);
            return bCashDesc - aCashDesc;
          case "cash-asc":
            const aCashAsc = parseNumericValue(a.itemData.cash_value);
            const bCashAsc = parseNumericValue(b.itemData.cash_value);
            return aCashAsc - bCashAsc;
          case "duped-desc":
            const aDupedDesc = parseNumericValue(a.itemData.duped_value);
            const bDupedDesc = parseNumericValue(b.itemData.duped_value);
            return bDupedDesc - aDupedDesc;
          case "duped-asc":
            const aDupedAsc = parseNumericValue(a.itemData.duped_value);
            const bDupedAsc = parseNumericValue(b.itemData.duped_value);
            return aDupedAsc - bDupedAsc;
          default:
            return a.itemData.name.localeCompare(b.itemData.name);
        }
      });
    }

    // Original logic for showing owned items
    const filtered = initialData.data.filter((item) => {
      const itemData = currentItemsData.find(
        (data) => data.id === item.item_id,
      );
      if (!itemData) return false;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !itemData.name.toLowerCase().includes(searchLower) &&
          !itemData.type.toLowerCase().includes(searchLower) &&
          !itemData.creator.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(itemData.type)) {
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
      const baseItemData = currentItemsData.find(
        (data) => data.id === item.item_id,
      )!;
      const variantValues = getVariantSpecificValues(item, baseItemData);

      // Create a modified item data object with variant-specific values
      const itemDataWithVariants = {
        ...baseItemData,
        cash_value: variantValues.cash_value,
        duped_value: variantValues.duped_value,
      };

      return {
        item,
        itemData: itemDataWithVariants,
      };
    });

    // Sort the items
    return [...mappedItems].sort((a, b) => {
      switch (sortOrder) {
        case "duplicates":
          // Group duplicates together and sort alphabetically by item name, then by creation date
          const aKey = `${a.item.categoryTitle}-${a.item.title}`;
          const bKey = `${b.item.categoryTitle}-${b.item.title}`;

          // Use appropriate counts based on hideDuplicates setting
          const countsToUse = hideDuplicates
            ? filteredDuplicateCounts
            : duplicateCounts;
          const aCount = countsToUse.get(aKey) || 0;
          const bCount = countsToUse.get(bKey) || 0;

          // Prioritize duplicates (items with count > 1) over singles
          if (aCount > 1 && bCount === 1) return -1; // a is duplicate, b is single
          if (aCount === 1 && bCount > 1) return 1; // a is single, b is duplicate

          // If both are duplicates or both are singles, sort by item name alphabetically
          const itemNameCompare = a.item.title.localeCompare(b.item.title);
          if (itemNameCompare !== 0) return itemNameCompare;

          // If same item name, sort by ID to match duplicate numbering
          return a.item.id.localeCompare(b.item.id);
        case "alpha-asc":
          return a.item.title.localeCompare(b.item.title);
        case "alpha-desc":
          return b.item.title.localeCompare(a.item.title);
        case "created-asc":
          const aCreatedAsc = a.item.info.find(
            (info) => info.title === "Created At",
          )?.value;
          const bCreatedAsc = b.item.info.find(
            (info) => info.title === "Created At",
          )?.value;
          if (aCreatedAsc && bCreatedAsc) {
            return (
              new Date(aCreatedAsc).getTime() - new Date(bCreatedAsc).getTime()
            );
          }
          return 0;
        case "created-desc":
          const aCreatedDesc = a.item.info.find(
            (info) => info.title === "Created At",
          )?.value;
          const bCreatedDesc = b.item.info.find(
            (info) => info.title === "Created At",
          )?.value;
          if (aCreatedDesc && bCreatedDesc) {
            return (
              new Date(bCreatedDesc).getTime() -
              new Date(aCreatedDesc).getTime()
            );
          }
          return 0;
        case "cash-desc":
          const aCashDesc = parseNumericValue(a.itemData?.cash_value);
          const bCashDesc = parseNumericValue(b.itemData?.cash_value);
          return bCashDesc - aCashDesc;
        case "cash-asc":
          const aCashAsc = parseNumericValue(a.itemData?.cash_value);
          const bCashAsc = parseNumericValue(b.itemData?.cash_value);
          return aCashAsc - bCashAsc;
        case "duped-desc":
          const aDupedDesc = parseNumericValue(a.itemData?.duped_value);
          const bDupedDesc = parseNumericValue(b.itemData?.duped_value);
          return bDupedDesc - aDupedDesc;
        case "duped-asc":
          const aDupedAsc = parseNumericValue(a.itemData?.duped_value);
          const bDupedAsc = parseNumericValue(b.itemData?.duped_value);
          return aDupedAsc - bDupedAsc;
        default:
          return 0;
      }
    });
  }, [
    initialData.data,
    currentItemsData,
    searchTerm,
    selectedCategories,
    showOnlyOriginal,
    showOnlyNonOriginal,
    hideDuplicates,
    showMissingItems,
    sortOrder,
    duplicateCounts,
    filteredDuplicateCounts,
  ]);

  // Use the pre-calculated duplicate counts from full inventory
  const itemCounts = hideDuplicates ? filteredDuplicateCounts : duplicateCounts;

  // Create a map to track the order of duplicates based on creation date (using ALL items from full inventory)
  const duplicateOrders = useMemo(() => {
    const orders = new Map<string, number>();

    // Group items by name using ALL items from full inventory
    const itemGroups = new Map<string, InventoryItem[]>();
    initialData.data.forEach((item) => {
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
  }, [initialData.data]);

  // Available categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    currentItemsData.forEach((item) => {
      if (item.type) {
        categories.add(item.type);
      }
    });
    return Array.from(categories).sort();
  }, [currentItemsData]);

  // Calculate duplicate statistics for all inventories
  const inventoryStats = useMemo(() => {
    const totalItems = initialData.data.length;

    // Calculate duplicate statistics
    const duplicateCounts = new Map<string, number>();
    initialData.data.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      duplicateCounts.set(key, (duplicateCounts.get(key) || 0) + 1);
    });

    const duplicates = Array.from(duplicateCounts.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]); // Sort by count descending

    return {
      isLargeInventory: false, // Always false now since we support all sizes
      totalItems,
      duplicates,
      totalDuplicates: duplicates.reduce((sum, [, count]) => sum + count, 0),
      uniqueItems: duplicateCounts.size,
    };
  }, [initialData.data]);

  // Check if there are any duplicates
  const hasDuplicates = useMemo(() => {
    return inventoryStats.duplicates.length > 0;
  }, [inventoryStats.duplicates]);

  return (
    <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
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
        hideDuplicates={hideDuplicates}
        showMissingItems={showMissingItems}
        availableCategories={availableCategories}
        onFilterToggle={handleOriginalFilterToggle}
        onNonOriginalFilterToggle={handleNonOriginalFilterToggle}
        onHideDuplicatesToggle={handleHideDuplicatesToggle}
        onShowMissingItemsToggle={handleShowMissingItemsToggle}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        hasDuplicates={hasDuplicates}
      />

      {/* Item Counter */}
      <div className="mb-4">
        <p className="text-secondary-text">
          {searchTerm ||
          showOnlyOriginal ||
          showOnlyNonOriginal ||
          hideDuplicates ||
          showMissingItems ||
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
              }${selectedCategories.length > 0 ? ` in ${selectedCategories[0]}` : ""}`
            : `Total Items: ${filteredAndSortedItems.length}`}
        </p>
      </div>

      {/* Duplicate Info */}
      {inventoryStats.duplicates.length > 0 && (
        <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-4">
          <div className="text-primary-text mb-3 flex items-center gap-2 text-sm">
            <span className="font-medium">Multiple Copies Found</span>
          </div>
          <div className="text-secondary-text space-y-1 text-sm">
            <div>
              {isOwnInventory ? "You have" : "They have"}{" "}
              <span className="text-primary-text font-semibold">
                {inventoryStats.duplicates.length}
              </span>{" "}
              different items with multiple copies
            </div>
            <div>
              Total copies:{" "}
              <span className="text-primary-text font-semibold">
                {inventoryStats.totalDuplicates}
              </span>
            </div>
            <div className="mt-2 text-xs">
              Items with most copies:{" "}
              {inventoryStats.duplicates
                .slice(0, 3)
                .map(([itemName, count]) => {
                  const [categoryTitle, title] = itemName.split("-");
                  const href = `/item/${encodeURIComponent(categoryTitle.toLowerCase())}/${encodeURIComponent(title)}`;
                  return (
                    <span key={itemName}>
                      <Tooltip
                        title={`View ${title} details`}
                        placement="top"
                        arrow
                        slotProps={{
                          tooltip: {
                            sx: {
                              backgroundColor: "var(--color-secondary-bg)",
                              color: "var(--color-primary-text)",
                              fontSize: "0.75rem",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                              "& .MuiTooltip-arrow": {
                                color: "var(--color-secondary-bg)",
                              },
                            },
                          },
                        }}
                      >
                        <Link
                          href={href}
                          className="text-primary-text hover:text-button-primary cursor-pointer font-medium transition-colors hover:underline"
                        >
                          {title} ({count})
                        </Link>
                      </Tooltip>
                    </span>
                  );
                })
                .reduce(
                  (acc, curr, index) =>
                    acc.concat(index === 0 ? [curr] : [", ", curr]),
                  [] as React.ReactNode[],
                )}
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {/* Pro Tip - Only show when there are results and not filtering */}
      {!isFiltering && filteredAndSortedItems.length > 0 && (
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

      <InventoryItemsGrid
        filteredItems={filteredAndSortedItems}
        getUserDisplay={getUserDisplay}
        getUserAvatar={getUserAvatar}
        getHasVerifiedBadge={getHasVerifiedBadge}
        onCardClick={handleCardClick}
        isLoading={isFiltering}
        userId={initialData.user_id}
        itemCounts={itemCounts}
        duplicateOrders={duplicateOrders}
        onVisibleUserIdsChange={handleVisibleUserIdsChange}
      />

      {/* Action Modal */}
      {showActionModal && selectedItemForAction && (
        <ItemActionModal
          isOpen={showActionModal}
          onClose={closeActionModal}
          item={selectedItemForAction}
          onViewTradeHistory={handleViewTradeHistory}
        />
      )}
    </div>
  );
}
