"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { RobloxUser, Item } from "@/types";
import { InventoryData, InventoryItem } from "@/app/inventories/types";
import ItemActionModal from "@/components/Modals/ItemActionModal";
import InventoryFilters from "./InventoryFilters";
import InventoryItemsGrid from "./InventoryItemsGrid";

interface InventoryItemsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  onItemClick: (item: InventoryItem) => void;
  itemsData?: Item[];
  onPageChange?: (page: number) => void;
}

export default function InventoryItems({
  initialData,
  robloxUsers,
  robloxAvatars,
  onItemClick,
  itemsData: propItemsData,
  onPageChange,
}: InventoryItemsProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showOnlyOriginal, setShowOnlyOriginal] = useState(false);
  const [showOnlyNonOriginal, setShowOnlyNonOriginal] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [localRobloxUsers, setLocalRobloxUsers] =
    useState<Record<string, RobloxUser>>(robloxUsers);
  const [localRobloxAvatars, setLocalRobloxAvatars] =
    useState<Record<string, string>>(robloxAvatars);
  const [itemsData, setItemsData] = useState<Item[]>(propItemsData || []);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] =
    useState<InventoryItem | null>(null);
  const [sortOrder, setSortOrder] = useState<
    "duplicates" | "alpha-asc" | "alpha-desc" | "created-asc" | "created-desc"
  >("created-desc");

  const itemsPerPage = 20;

  // Event handlers
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
      setShowOnlyNonOriginal(false); // Uncheck the other option
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
      setShowOnlyOriginal(false); // Uncheck the other option
    } else {
      setShowOnlyNonOriginal(false);
    }
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  };

  // Helper functions for user data
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = localRobloxUsers[userId];
      if (!user) return userId;
      return user.displayName || user.name || userId;
    },
    [localRobloxUsers],
  );

  const getUserAvatar = useCallback(
    (userId: string) => {
      return localRobloxAvatars[userId] || "";
    },
    [localRobloxAvatars],
  );

  // Effects
  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    showOnlyOriginal,
    showOnlyNonOriginal,
    selectedCategories,
    sortOrder,
  ]);

  useEffect(() => {
    if (propItemsData) {
      setItemsData(propItemsData);
    }
  }, [propItemsData]);

  useEffect(() => {
    setLocalRobloxUsers(robloxUsers);
    setLocalRobloxAvatars(robloxAvatars);
  }, [robloxUsers, robloxAvatars]);

  // Pre-calculate duplicate counts from FULL inventory (not filtered) for consistent numbering
  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    initialData.data.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [initialData.data]);

  // Filter and sort logic
  const filteredAndSortedItems = useMemo(() => {
    const filtered = initialData.data.filter((item) => {
      const itemData = itemsData.find((data) => data.id === item.item_id);
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

    const mappedItems = filtered.map((item) => ({
      item,
      itemData: itemsData.find((data) => data.id === item.item_id)!,
    }));

    // Sort the items
    return [...mappedItems].sort((a, b) => {
      switch (sortOrder) {
        case "duplicates":
          // Group duplicates together and sort alphabetically by item name, then by creation date
          const aKey = `${a.item.categoryTitle}-${a.item.title}`;
          const bKey = `${b.item.categoryTitle}-${b.item.title}`;

          // Use pre-calculated counts (much faster!)
          const aCount = duplicateCounts.get(aKey) || 0;
          const bCount = duplicateCounts.get(bKey) || 0;

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
        default:
          return 0;
      }
    });
  }, [
    initialData.data,
    itemsData,
    searchTerm,
    selectedCategories,
    showOnlyOriginal,
    showOnlyNonOriginal,
    sortOrder,
    duplicateCounts,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  // Use the pre-calculated duplicate counts from full inventory
  const itemCounts = duplicateCounts;

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
    itemsData.forEach((item) => {
      if (item.type) {
        categories.add(item.type);
      }
    });
    return Array.from(categories).sort();
  }, [itemsData]);

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

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
        availableCategories={availableCategories}
        onFilterToggle={handleOriginalFilterToggle}
        onNonOriginalFilterToggle={handleNonOriginalFilterToggle}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Duplicate Info */}
      {inventoryStats.duplicates.length > 0 && (
        <div className="border-button-info bg-button-info/10 mb-4 rounded-lg border p-4">
          <div className="text-primary-text mb-3 flex items-center gap-2 text-sm">
            <span className="text-button-info">📊</span>
            <span className="font-medium">Duplicate Items Found</span>
          </div>
          <div className="text-secondary-text space-y-1 text-sm">
            <div>
              Found{" "}
              <span className="text-primary-text font-semibold">
                {inventoryStats.duplicates.length}
              </span>{" "}
              items with duplicates
            </div>
            <div>
              Total duplicate items:{" "}
              <span className="text-primary-text font-semibold">
                {inventoryStats.totalDuplicates}
              </span>
            </div>
            <div className="mt-2 text-xs">
              Top duplicates:{" "}
              {inventoryStats.duplicates
                .slice(0, 3)
                .map(([itemName, count]) => (
                  <span
                    key={itemName}
                    className="text-primary-text font-medium"
                  >
                    {itemName.split("-")[1]} ({count})
                  </span>
                ))
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
          <div className="text-primary-text flex items-center gap-2 text-sm">
            <span className="text-button-info">💡</span>
            <span className="font-medium">Pro Tip:</span>
            <span>Click on any item card to view its ownership history.</span>
          </div>
        </div>
      )}

      <InventoryItemsGrid
        filteredItems={paginatedItems}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        getUserDisplay={getUserDisplay}
        getUserAvatar={getUserAvatar}
        onCardClick={handleCardClick}
        isLoading={isFiltering}
        userId={initialData.user_id}
        itemCounts={itemCounts}
        duplicateOrders={duplicateOrders}
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
