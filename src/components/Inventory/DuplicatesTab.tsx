"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import InventoryItemsGrid from "./InventoryItemsGrid";
import { Item, RobloxUser } from "@/types";
import { InventoryItem } from "@/app/inventories/types";
import { fetchMissingRobloxData } from "@/app/inventories/actions";

interface DuplicatesTabProps {
  initialData: { data: InventoryItem[]; user_id: string };
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  onItemClick: (item: InventoryItem) => void;
  itemsData: Item[];
}

type SortOrder =
  | "count-desc"
  | "count-asc"
  | "created-asc"
  | "created-desc"
  | "cash-desc"
  | "cash-asc"
  | "duped-desc"
  | "duped-asc"
  | "alpha-asc"
  | "alpha-desc";

export default function DuplicatesTab({
  initialData,
  robloxUsers,
  robloxAvatars,
  onItemClick,
  itemsData,
}: DuplicatesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("count-desc");
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const MAX_SEARCH_LENGTH = 50;

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

  // Helper functions - use localRobloxUsers which includes fetched data
  const getUserDisplay = (userId: string) => {
    const user = localRobloxUsers[userId];
    if (!user) return userId;
    return user.displayName || user.name || userId;
  };

  const getUserAvatar = (userId: string) => {
    return robloxAvatars[userId] || "";
  };

  const getHasVerifiedBadge = (userId: string) => {
    const user = localRobloxUsers[userId];
    return Boolean(user?.hasVerifiedBadge);
  };

  // Count duplicates across entire inventory
  const duplicateCounts = (() => {
    const counts = new Map<string, number>();
    initialData.data.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  })();

  // Filter to only show items with multiple copies
  const itemsWithMultipleCopies = (() => {
    return initialData.data.filter((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      return (duplicateCounts.get(key) || 0) > 1;
    });
  })();

  // Create a map to track the order of duplicates based on creation date (only for items with multiple copies)
  const duplicateOrders = (() => {
    const orders = new Map<string, number>();

    // Group items by name (only from itemsWithMultipleCopies)
    const itemGroups = new Map<string, InventoryItem[]>();
    itemsWithMultipleCopies.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      const existing = itemGroups.get(key) || [];
      itemGroups.set(key, [...existing, item]);
    });

    // For each group, sort by creation date and assign order numbers
    itemGroups.forEach((items) => {
      const sortedItems = [...items].sort((a, b) => {
        const aTime =
          a.info.find((i) => i.title === "Created At")?.value || "0";
        const bTime =
          b.info.find((i) => i.title === "Created At")?.value || "0";
        return aTime.localeCompare(bTime);
      });

      sortedItems.forEach((item, index) => {
        // Use a unique key that combines id and other unique properties to handle items with same id
        const uniqueKey = `${item.id}-${item.timesTraded}-${item.uniqueCirculation}`;
        orders.set(uniqueKey, index + 1);
      });
    });

    return orders;
  })();

  // Calculate stats
  const multiCopyStats = (() => {
    const uniqueItems = new Set<string>();
    let totalCopies = 0;
    const itemCopyCounts: Array<{
      title: string;
      category: string;
      count: number;
    }> = [];

    duplicateCounts.forEach((count, key) => {
      if (count > 1) {
        uniqueItems.add(key);
        totalCopies += count;
        const [category, title] = key.split("-");
        itemCopyCounts.push({ title, category, count });
      }
    });

    itemCopyCounts.sort((a, b) => b.count - a.count);
    const topItem = itemCopyCounts[0];

    return {
      uniqueItemsWithCopies: uniqueItems.size,
      totalCopies,
      topItem: topItem
        ? {
            title: topItem.title,
            category: topItem.category,
            count: topItem.count,
          }
        : null,
      allDuplicateItems: itemCopyCounts.slice(0, 100),
    };
  })();

  // Get available categories from items with multiple copies
  const availableCategories = (() => {
    const categories = new Set<string>();
    itemsWithMultipleCopies.forEach((item) => {
      if (item.categoryTitle) {
        categories.add(item.categoryTitle);
      }
    });
    return Array.from(categories).sort();
  })();

  // TanStack Virtual setup for performance with large duplicate datasets
  const virtualizer = useVirtualizer({
    count: multiCopyStats.allDuplicateItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Recalculate heights on window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      virtualizer.measure();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parse numeric values
  const parseNumericValue = (value: string | null): number => {
    if (!value || value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    if (value.toLowerCase().includes("b")) return num * 1000000000;
    return num;
  };

  // Filter and sort items (same logic as InventoryItems)
  const filteredAndSortedItems = (() => {
    let filtered = [...itemsWithMultipleCopies];

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(searchLower),
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.categoryTitle === selectedCategory,
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      const aData = itemsData.find((data) => data.id === a.item_id);
      const bData = itemsData.find((data) => data.id === b.item_id);

      switch (sortOrder) {
        case "count-desc":
        case "count-asc": {
          const aKey = `${a.categoryTitle}-${a.title}`;
          const bKey = `${b.categoryTitle}-${b.title}`;
          const aCount = duplicateCounts.get(aKey) || 0;
          const bCount = duplicateCounts.get(bKey) || 0;
          return sortOrder === "count-desc" ? bCount - aCount : aCount - bCount;
        }
        case "created-asc":
        case "created-desc": {
          const aTime =
            a.info.find((i) => i.title === "Created At")?.value || "0";
          const bTime =
            b.info.find((i) => i.title === "Created At")?.value || "0";
          return sortOrder === "created-asc"
            ? aTime.localeCompare(bTime)
            : bTime.localeCompare(aTime);
        }
        case "cash-desc":
        case "cash-asc": {
          if (!aData || !bData) return 0;
          const aValue = parseNumericValue(aData.cash_value);
          const bValue = parseNumericValue(bData.cash_value);
          return sortOrder === "cash-desc" ? bValue - aValue : aValue - bValue;
        }
        case "duped-desc":
        case "duped-asc": {
          if (!aData || !bData) return 0;
          const aValue = parseNumericValue(aData.duped_value);
          const bValue = parseNumericValue(bData.duped_value);
          return sortOrder === "duped-desc" ? bValue - aValue : aValue - bValue;
        }
        case "alpha-asc":
          return a.title.localeCompare(b.title);
        case "alpha-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  })();

  if (multiCopyStats.uniqueItemsWithCopies === 0) {
    return (
      <div className="bg-secondary-bg border-border-primary rounded-lg border p-8 text-center">
        <p className="text-secondary-text">
          No items with multiple copies found in this inventory.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Summary */}
      <div className="bg-secondary-bg border-border-primary shadow-card-shadow mb-6 rounded-lg border p-6">
        <h2 className="text-primary-text mb-4 text-xl font-semibold">
          Top Items by Copies
        </h2>

        {/* All Duplicate Items - Virtualized Scrollable */}
        {multiCopyStats.allDuplicateItems.length > 0 && (
          <div
            ref={parentRef}
            className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-96 overflow-y-auto pr-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--color-border-primary) transparent",
            }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item =
                  multiCopyStats.allDuplicateItems[virtualItem.index];
                const rank = virtualItem.index + 1;

                return (
                  <div
                    key={`${item.category}-${item.title}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="bg-tertiary-bg border-border-primary flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-primary-text font-bold text-sm w-6 flex-shrink-0">
                        #{rank}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <Link
                          href={`/item/${encodeURIComponent(item.category.toLowerCase())}/${encodeURIComponent(item.title)}`}
                          className="text-primary-text hover:text-link font-semibold text-sm truncate transition-colors"
                        >
                          {item.title}
                        </Link>
                        <span className="text-secondary-text text-xs capitalize">
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-primary-text font-bold text-sm whitespace-nowrap ml-2">
                      {item.count}x
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex w-full flex-col gap-4 sm:flex-row">
        {/* Search Bar */}
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={MAX_SEARCH_LENGTH}
            className="text-primary-text border-border-primary bg-secondary-bg placeholder-secondary-text focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <MagnifyingGlassIcon className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="hover:text-primary-text text-secondary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <XMarkIcon />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-1/3">
          <select
            className="select w-full bg-secondary-bg text-primary-text min-h-[56px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div className="w-full sm:w-1/3">
          <select
            className="select w-full bg-secondary-bg text-primary-text min-h-[56px]"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          >
            <option disabled>Copies</option>
            <option value="count-desc">Most Copies First</option>
            <option value="count-asc">Least Copies First</option>
            <option disabled>Date</option>
            <option value="created-asc">Oldest First</option>
            <option value="created-desc">Newest First</option>
            <option disabled>Values</option>
            <option value="cash-desc">Cash Value (High to Low)</option>
            <option value="cash-asc">Cash Value (Low to High)</option>
            <option value="duped-desc">Duped Value (High to Low)</option>
            <option value="duped-asc">Duped Value (Low to High)</option>
            <option disabled>Alphabetically</option>
            <option value="alpha-asc">A-Z</option>
            <option value="alpha-desc">Z-A</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-secondary-text text-sm">
          Showing {filteredAndSortedItems.length}{" "}
          {filteredAndSortedItems.length === 1 ? "copy" : "copies"}
          {searchTerm || selectedCategory
            ? ` (filtered from ${multiCopyStats.totalCopies} total)`
            : ""}
        </p>
      </div>

      {/* Cards container with secondary background */}
      <div className="bg-secondary-bg rounded-lg p-4">
        {/* Use InventoryItemsGrid - same as InventoryItems tab */}
        <InventoryItemsGrid
          filteredItems={filteredAndSortedItems.map((item) => ({
            item,
            itemData: itemsData.find((data) => data.id === item.item_id)!,
          }))}
          getUserDisplay={getUserDisplay}
          getUserAvatar={getUserAvatar}
          getHasVerifiedBadge={getHasVerifiedBadge}
          onCardClick={onItemClick}
          itemCounts={duplicateCounts}
          duplicateOrders={duplicateOrders}
          userId={initialData.user_id}
          isLoading={false}
          onVisibleUserIdsChange={handleVisibleUserIdsChange}
        />
      </div>
    </div>
  );
}
