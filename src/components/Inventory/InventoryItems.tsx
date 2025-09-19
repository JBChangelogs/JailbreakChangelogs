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
  const [sortOrder, setSortOrder] = useState<
    | "alpha-asc"
    | "alpha-desc"
    | "traded-desc"
    | "unique-desc"
    | "created-asc"
    | "created-desc"
    | "random"
    | "duplicates"
    | "cash-desc"
    | "cash-asc"
    | "duped-desc"
    | "duped-asc"
  >("cash-desc");

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

  const itemsPerPage = 20;

  // Helper functions
  const parseCashValueForTotal = (value: string | null): number => {
    if (value === null || value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    if (value.toLowerCase().includes("b")) return num * 1000000000;
    return num;
  };

  const parseDupedValueForTotal = (value: string | null): number => {
    if (value === null || value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    if (value.toLowerCase().includes("b")) return num * 1000000000;
    return num;
  };

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

  // Helper function to get duped value for an item using DupeFinder logic
  const getDupedValueForItem = useCallback(
    (itemData: Item, inventoryItem: InventoryItem): number => {
      let dupedValue = parseDupedValueForTotal(itemData.duped_value);

      if ((isNaN(dupedValue) || dupedValue <= 0) && itemData.children) {
        const createdAtInfo = inventoryItem.info.find(
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
          dupedValue = parseDupedValueForTotal(matchingChild.data.duped_value);
        }
      }

      return isNaN(dupedValue) ? 0 : dupedValue;
    },
    [],
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

    // Sort items
    filtered.sort((a, b) => {
      const itemDataA = itemsData.find((data) => data.id === a.item_id);
      const itemDataB = itemsData.find((data) => data.id === b.item_id);
      if (!itemDataA || !itemDataB) return 0;

      switch (sortOrder) {
        case "alpha-asc":
          return itemDataA.name.localeCompare(itemDataB.name);
        case "alpha-desc":
          return itemDataB.name.localeCompare(itemDataA.name);
        case "cash-desc":
          return (
            parseCashValueForTotal(itemDataB.cash_value) -
            parseCashValueForTotal(itemDataA.cash_value)
          );
        case "cash-asc":
          return (
            parseCashValueForTotal(itemDataA.cash_value) -
            parseCashValueForTotal(itemDataB.cash_value)
          );
        case "duped-desc":
          return (
            getDupedValueForItem(itemDataB, b) -
            getDupedValueForItem(itemDataA, a)
          );
        case "duped-asc":
          return (
            getDupedValueForItem(itemDataA, a) -
            getDupedValueForItem(itemDataB, b)
          );
        case "traded-desc":
          return b.timesTraded - a.timesTraded;
        case "unique-desc":
          return b.uniqueCirculation - a.uniqueCirculation;
        case "created-asc":
          return 0; // Created date sorting not available for inventory items
        case "created-desc":
          return 0; // Created date sorting not available for inventory items
        case "duplicates":
          return b.isOriginalOwner ? 1 : -1;
        case "random":
          return Math.random() - 0.5;
        default:
          return 0;
      }
    });

    return filtered.map((item) => ({
      item,
      itemData: itemsData.find((data) => data.id === item.item_id)!,
    }));
  }, [
    initialData.data,
    itemsData,
    searchTerm,
    selectedCategories,
    showOnlyOriginal,
    showOnlyNonOriginal,
    sortOrder,
    getDupedValueForItem,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  // Create a map to track duplicate items
  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    paginatedItems.forEach((item) => {
      const key = `${item.item.categoryTitle}-${item.item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [paginatedItems]);

  // Create a map to track the order of duplicates based on creation date
  const duplicateOrders = useMemo(() => {
    const orders = new Map<string, number>();

    // Group items by name
    const itemGroups = new Map<string, InventoryItem[]>();
    paginatedItems.forEach((item) => {
      const key = `${item.item.categoryTitle}-${item.item.title}`;
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item.item);
    });

    // Sort each group by creation date (oldest first) and assign numbers
    itemGroups.forEach((items) => {
      if (items.length > 1) {
        // Sort by creation date (oldest first)
        const sortedItems = items.sort((a, b) => {
          // Check if info exists before trying to find
          if (!a.info || !b.info) return 0;

          const aCreated = a.info.find(
            (info) => info.title === "Created At",
          )?.value;
          const bCreated = b.info.find(
            (info) => info.title === "Created At",
          )?.value;

          if (!aCreated || !bCreated) return 0;

          // Parse dates in format "Nov 6, 2022"
          const aDate = new Date(aCreated);
          const bDate = new Date(bCreated);

          // Check if dates are valid
          if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) return 0;

          return aDate.getTime() - bDate.getTime();
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
  }, [paginatedItems]);

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="text-muted mb-4 text-xl font-semibold">Inventory Items</h2>

      {/* Filters */}
      <InventoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        sortOrder={sortOrder}
        setSortOrder={(order) => setSortOrder(order as typeof sortOrder)}
        showOnlyOriginal={showOnlyOriginal}
        showOnlyNonOriginal={showOnlyNonOriginal}
        availableCategories={availableCategories}
        onFilterToggle={handleOriginalFilterToggle}
        onNonOriginalFilterToggle={handleNonOriginalFilterToggle}
      />

      {/* Items Grid */}
      {/* Pro Tip - Only show when there are results and not filtering */}
      {!isFiltering && filteredAndSortedItems.length > 0 && (
        <div className="mb-4 rounded-lg border border-[#5865F2] bg-[#5865F2]/10 p-3">
          <div className="flex items-center gap-2 text-sm text-[#FFFFFF]">
            <span className="text-[#5865F2]">💡</span>
            <span className="font-medium">Pro Tip:</span>
            <span>Click on any item card to view its trading history.</span>
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
