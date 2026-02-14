"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "@/components/ui/IconWrapper";
import { useDebounce } from "@/hooks/useDebounce";
import InventoryItemsGrid from "./InventoryItemsGrid";
import { Item, RobloxUser } from "@/types";
import { InventoryItem } from "@/app/inventories/types";
import { mergeInventoryArrayWithMetadata } from "@/utils/inventoryMerge";
import { getCategoryIcon, getCategoryColor } from "@/utils/categoryIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DuplicatesTabProps {
  initialData: {
    data: InventoryItem[];
    user_id: string;
    duplicates?: InventoryItem[];
  };
  robloxUsers: Record<string, RobloxUser>;
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
  onItemClick,
  itemsData,
}: DuplicatesTabProps) {
  "use no memo";
  const [searchTerm, setSearchTerm] = useState("");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLeaderboardCategory, setSelectedLeaderboardCategory] =
    useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("count-desc");
  const parentRef = useRef<HTMLDivElement>(null);
  const MAX_SEARCH_LENGTH = 50;
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const debouncedLeaderboardSearch = useDebounce(leaderboardSearch, 250);
  const selectedLeaderboardCategoryValue = selectedLeaderboardCategory || "all";
  const selectedCategoryValue = selectedCategory || "all";
  const sortLabels: Record<SortOrder, string> = {
    "count-desc": "Most Copies First",
    "count-asc": "Least Copies First",
    "created-asc": "Oldest First",
    "created-desc": "Newest First",
    "cash-desc": "Cash Value (High to Low)",
    "cash-asc": "Cash Value (Low to High)",
    "duped-desc": "Duped Value (High to Low)",
    "duped-asc": "Duped Value (Low to High)",
    "alpha-asc": "A-Z",
    "alpha-desc": "Z-A",
  };

  // Helper functions - use robloxUsers from props
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

  // Get values (removed variant-specific logic)
  const getVariantSpecificValues = (
    item: InventoryItem,
    baseItemData: Item,
  ) => {
    // Use base item values
    return {
      cash_value: baseItemData.cash_value,
      duped_value: baseItemData.duped_value,
    };
  };

  // Combine data from both inventory.data and inventory.duplicates (if it exists)
  // Track which items come from duplicates array for visual indication
  const combinedInventoryData = useMemo(() => {
    const regularItems = initialData.data || [];
    const duplicateItems = initialData.duplicates || [];
    const combined = [...regularItems, ...duplicateItems];

    // Mark items from duplicates array
    const duplicateItemIds = new Set(duplicateItems.map((item) => item.id));
    return combined.map((item) => ({
      ...item,
      _isDupedItem: duplicateItemIds.has(item.id),
    }));
  }, [initialData.data, initialData.duplicates]);

  // Merge combined inventory data with live metadata from item/list endpoint
  const mergedInventoryData = useMemo(
    () => mergeInventoryArrayWithMetadata(combinedInventoryData, itemsData),
    [combinedInventoryData, itemsData],
  );

  // Count duplicates across entire inventory (including items from duplicates array)
  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    mergedInventoryData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [mergedInventoryData]);

  // Filter to only show items with multiple copies
  const itemsWithMultipleCopies = useMemo(() => {
    return mergedInventoryData.filter((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      return (duplicateCounts.get(key) || 0) > 1;
    });
  }, [duplicateCounts, mergedInventoryData]);

  // Create a map to track the order of duplicates based on creation date (only for items with multiple copies)
  const duplicateOrders = useMemo(() => {
    const orders = new Map<string, number>();

    // Group items by name (only from itemsWithMultipleCopies)
    const itemGroups = new Map<string, InventoryItem[]>();
    itemsWithMultipleCopies.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      const existing = itemGroups.get(key) || [];
      itemGroups.set(key, [...existing, item]);
    });

    // For each group, sort by ID for consistent ordering
    itemGroups.forEach((items) => {
      const sortedItems = items.sort((a, b) => {
        return a.id.localeCompare(b.id);
      });

      sortedItems.forEach((item, index) => {
        // Use a unique key that combines id and other unique properties to handle items with same id
        const uniqueKey = `${item.id}-${item.timesTraded}-${item.uniqueCirculation}`;
        orders.set(uniqueKey, index + 1);
      });
    });

    return orders;
  }, [itemsWithMultipleCopies]);

  // Calculate stats
  const multiCopyStats = useMemo(() => {
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
        const [category, ...titleParts] = key.split("-");
        const title = titleParts.join("-");
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
  }, [duplicateCounts]);

  // Get available categories from items with multiple copies
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    itemsWithMultipleCopies.forEach((item) => {
      if (item.categoryTitle) {
        categories.add(item.categoryTitle);
      }
    });
    return Array.from(categories).sort();
  }, [itemsWithMultipleCopies]);

  const itemDataById = useMemo(() => {
    return new Map(itemsData.map((item) => [item.id, item]));
  }, [itemsData]);

  // Filter leaderboard items based on search and category
  const filteredLeaderboardItems = useMemo(() => {
    let items = multiCopyStats.allDuplicateItems;

    // Filter by category
    if (selectedLeaderboardCategory) {
      items = items.filter(
        (item) => item.category === selectedLeaderboardCategory,
      );
    }

    if (!debouncedLeaderboardSearch.trim()) {
      return items;
    }

    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tokenize = (str: string) =>
      str.toLowerCase().match(/[a-z0-9]+/g) || [];
    const splitAlphaNum = (str: string) => {
      return (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());
    };

    const searchNormalized = normalize(debouncedLeaderboardSearch);
    const searchTokens = tokenize(debouncedLeaderboardSearch);
    const searchAlphaNum = splitAlphaNum(debouncedLeaderboardSearch);

    function isTokenSubsequence(searchTokens: string[], nameTokens: string[]) {
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

    return items.filter((item) => {
      const titleNormalized = normalize(item.title);
      const categoryNormalized = normalize(item.category);
      const titleTokens = tokenize(item.title);
      const titleAlphaNum = splitAlphaNum(item.title);

      return (
        titleNormalized.includes(searchNormalized) ||
        categoryNormalized.includes(searchNormalized) ||
        isTokenSubsequence(searchTokens, titleTokens) ||
        isTokenSubsequence(searchAlphaNum, titleAlphaNum)
      );
    });
  }, [
    multiCopyStats.allDuplicateItems,
    debouncedLeaderboardSearch,
    selectedLeaderboardCategory,
  ]);

  // TanStack Virtual setup for performance with large duplicate datasets
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredLeaderboardItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

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
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...itemsWithMultipleCopies];

    // Filter by search term
    if (debouncedSearchTerm.trim()) {
      const normalize = (str: string) =>
        str.toLowerCase().replace(/[^a-z0-9]/g, "");
      const tokenize = (str: string) =>
        str.toLowerCase().match(/[a-z0-9]+/g) || [];
      const splitAlphaNum = (str: string) => {
        return (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());
      };

      const searchNormalized = normalize(debouncedSearchTerm);
      const searchTokens = tokenize(debouncedSearchTerm);
      const searchAlphaNum = splitAlphaNum(debouncedSearchTerm);

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

      filtered = filtered.filter((item) => {
        const itemData = itemDataById.get(item.item_id);
        if (!itemData) return false;

        const titleNormalized = normalize(item.title);
        const categoryNormalized = normalize(item.categoryTitle);
        const nameNormalized = normalize(itemData.name);
        const typeNormalized = normalize(itemData.type);
        const titleTokens = tokenize(item.title);
        const titleAlphaNum = splitAlphaNum(item.title);
        const nameTokens = tokenize(itemData.name);
        const nameAlphaNum = splitAlphaNum(itemData.name);

        return (
          titleNormalized.includes(searchNormalized) ||
          categoryNormalized.includes(searchNormalized) ||
          nameNormalized.includes(searchNormalized) ||
          typeNormalized.includes(searchNormalized) ||
          isTokenSubsequence(searchTokens, titleTokens) ||
          isTokenSubsequence(searchAlphaNum, titleAlphaNum) ||
          isTokenSubsequence(searchTokens, nameTokens) ||
          isTokenSubsequence(searchAlphaNum, nameAlphaNum)
        );
      });
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.categoryTitle === selectedCategory,
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      const aData = itemDataById.get(a.item_id);
      const bData = itemDataById.get(b.item_id);

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
          const aVariantValues = getVariantSpecificValues(a, aData);
          const bVariantValues = getVariantSpecificValues(b, bData);
          const aValue = parseNumericValue(aVariantValues.cash_value);
          const bValue = parseNumericValue(bVariantValues.cash_value);
          return sortOrder === "cash-desc" ? bValue - aValue : aValue - bValue;
        }
        case "duped-desc":
        case "duped-asc": {
          if (!aData || !bData) return 0;
          const aVariantValues = getVariantSpecificValues(a, aData);
          const bVariantValues = getVariantSpecificValues(b, bData);
          const aValue = parseNumericValue(aVariantValues.duped_value);
          const bValue = parseNumericValue(bVariantValues.duped_value);
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
  }, [
    debouncedSearchTerm,
    selectedCategory,
    sortOrder,
    itemsWithMultipleCopies,
    itemDataById,
    duplicateCounts,
  ]);

  if (multiCopyStats.uniqueItemsWithCopies === 0) {
    return (
      <div className="border-border-card bg-secondary-bg rounded-lg border p-8 text-center">
        <p className="text-secondary-text">
          No items with multiple copies found in this inventory.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Summary */}
      <div className="border-border-card bg-secondary-bg mb-6 rounded-lg border p-6">
        <h2 className="text-primary-text mb-4 text-xl font-semibold">
          Top Items by Copies
        </h2>

        {/* Leaderboard Search */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search leaderboard..."
              value={leaderboardSearch}
              onChange={(e) => setLeaderboardSearch(e.target.value)}
              maxLength={MAX_SEARCH_LENGTH}
              className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info min-h-[48px] w-full rounded-lg border px-4 py-2 pr-10 pl-10 transition-all duration-300 focus:outline-none"
            />
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            />
            {leaderboardSearch && (
              <button
                onClick={() => setLeaderboardSearch("")}
                className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
                aria-label="Clear search"
              >
                <Icon icon="heroicons:x-mark" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-1/3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border-card bg-tertiary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 flex h-[48px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                  aria-label="Filter leaderboard by category"
                >
                  <span className="truncate">
                    {selectedLeaderboardCategoryValue === "all"
                      ? "All Categories"
                      : selectedLeaderboardCategoryValue}
                  </span>
                  <Icon
                    icon="heroicons:chevron-down"
                    className="text-secondary-text h-5 w-5"
                    inline={true}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="border-border-card bg-tertiary-bg text-primary-text scrollbar-thin max-h-[280px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
              >
                <DropdownMenuRadioGroup
                  value={selectedLeaderboardCategoryValue}
                  onValueChange={(val) => {
                    const nextVal = val === "all" ? "" : val;
                    setSelectedLeaderboardCategory(nextVal);
                    window.umami?.track(
                      "Multiple Copies Leaderboard Category Change",
                      {
                        category: val === "all" ? "All" : val,
                      },
                    );
                  }}
                >
                  <DropdownMenuRadioItem
                    value="all"
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    All Categories
                  </DropdownMenuRadioItem>
                  {availableCategories.map((category) => (
                    <DropdownMenuRadioItem
                      key={category}
                      value={category}
                      className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                    >
                      {category}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results count for leaderboard */}
        {leaderboardSearch && (
          <div className="mb-3">
            <p className="text-secondary-text text-xs">
              Showing {filteredLeaderboardItems.length} of{" "}
              {multiCopyStats.allDuplicateItems.length} items
            </p>
          </div>
        )}

        {/* All Duplicate Items - Virtualized Scrollable */}
        {multiCopyStats.allDuplicateItems.length > 0 &&
          filteredLeaderboardItems.length > 0 && (
            <div
              ref={parentRef}
              className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border-primary hover:scrollbar-thumb-border-focus max-h-96 overflow-y-auto rounded-lg"
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
                  const item = filteredLeaderboardItems[virtualItem.index];
                  const originalIndex =
                    multiCopyStats.allDuplicateItems.findIndex(
                      (leaderboardItem) =>
                        leaderboardItem.category === item.category &&
                        leaderboardItem.title === item.title,
                    );
                  const rank = originalIndex + 1;

                  return (
                    <div
                      key={`${item.category}-${item.title}`}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <div
                        className={`mb-3 flex items-center justify-between rounded-lg border p-3 transition-colors ${
                          rank <= 3
                            ? "hover:!bg-quaternary-bg"
                            : "border-border-card bg-tertiary-bg hover:bg-quaternary-bg"
                        }`}
                        style={{
                          ...(rank === 1 && {
                            background:
                              "linear-gradient(to right, hsl(45, 100%, 50%, 0.2), hsl(45, 100%, 45%, 0.2))",
                            borderColor: "hsl(45, 100%, 50%, 0.5)",
                          }),
                          ...(rank === 2 && {
                            background:
                              "linear-gradient(to right, hsl(0, 0%, 75%, 0.2), hsl(0, 0%, 65%, 0.2))",
                            borderColor: "hsl(0, 0%, 75%, 0.5)",
                          }),
                          ...(rank === 3 && {
                            background:
                              "linear-gradient(to right, hsl(30, 100%, 50%, 0.2), hsl(30, 100%, 45%, 0.2))",
                            borderColor: "hsl(30, 100%, 50%, 0.5)",
                          }),
                        }}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              rank <= 3 ? "text-black" : "text-primary-text"
                            }`}
                            style={{
                              ...(rank === 1 && {
                                background:
                                  "linear-gradient(to right, hsl(45, 100%, 50%), hsl(45, 100%, 45%))",
                              }),
                              ...(rank === 2 && {
                                background:
                                  "linear-gradient(to right, hsl(0, 0%, 75%), hsl(0, 0%, 65%))",
                              }),
                              ...(rank === 3 && {
                                background:
                                  "linear-gradient(to right, hsl(30, 100%, 50%), hsl(30, 100%, 45%))",
                              }),
                            }}
                          >
                            #{rank}
                          </span>
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link
                              href={`/item/${encodeURIComponent(item.category.toLowerCase())}/${encodeURIComponent(item.title)}`}
                              prefetch={false}
                              className="text-primary-text hover:text-link truncate text-sm font-semibold transition-colors"
                            >
                              {item.title}
                            </Link>
                            <span
                              className="text-primary-text bg-tertiary-bg/40 inline-flex h-6 w-fit items-center gap-1.5 rounded-lg border px-2.5 text-xs leading-none font-medium shadow-2xl backdrop-blur-xl"
                              style={{
                                borderColor: getCategoryColor(item.category),
                              }}
                            >
                              {(() => {
                                const categoryIcon = getCategoryIcon(
                                  item.category,
                                );
                                return categoryIcon ? (
                                  <categoryIcon.Icon
                                    className="h-3 w-3"
                                    style={{
                                      color: getCategoryColor(item.category),
                                    }}
                                  />
                                ) : null;
                              })()}
                              {item.category}
                            </span>
                          </div>
                        </div>
                        <span className="text-primary-text ml-2 text-sm font-bold whitespace-nowrap">
                          {item.count}x
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* No results message for leaderboard search */}
        {leaderboardSearch && filteredLeaderboardItems.length === 0 && (
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-4 text-center">
            <p className="text-secondary-text text-sm">
              No items found matching &quot;{leaderboardSearch}&quot;
            </p>
          </div>
        )}
      </div>

      <div className="mb-4 flex w-full flex-col gap-4 sm:flex-row">
        {/* Search Bar */}
        <div className="relative w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={MAX_SEARCH_LENGTH}
            className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
          />
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-secondary-text hover:text-primary-text absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
            >
              <Icon icon="heroicons:x-mark" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Filter by category"
              >
                <span className="truncate">
                  {selectedCategoryValue === "all"
                    ? "All categories"
                    : selectedCategoryValue}
                </span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={selectedCategoryValue}
                onValueChange={(val) => {
                  const nextVal = val === "all" ? "" : val;
                  setSelectedCategory(nextVal);
                  window.umami?.track("Multiple Copies Category Change", {
                    category: val === "all" ? "All" : val,
                  });
                }}
              >
                <DropdownMenuRadioItem
                  value="all"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  All categories
                </DropdownMenuRadioItem>
                {availableCategories.map((category) => (
                  <DropdownMenuRadioItem
                    key={category}
                    value={category}
                    className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                  >
                    {category}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sort Filter */}
        <div className="w-full sm:w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="border-border-card bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
                aria-label="Sort items"
              >
                <span className="truncate">
                  {sortLabels[sortOrder] ?? "Sort"}
                </span>
                <Icon
                  icon="heroicons:chevron-down"
                  className="text-secondary-text h-5 w-5"
                  inline={true}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="border-border-card bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(val) => {
                  const nextValue = val as SortOrder;
                  setSortOrder(nextValue);
                  window.umami?.track("Multiple Copies Sort Change", {
                    sort: nextValue,
                  });
                }}
              >
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Copies
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="count-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Most Copies First
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="count-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Least Copies First
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Date
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="created-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Oldest First
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="created-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Newest First
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Values
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="cash-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Cash Value (High to Low)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="cash-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Cash Value (Low to High)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="duped-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Duped Value (High to Low)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="duped-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Duped Value (Low to High)
                </DropdownMenuRadioItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-secondary-text px-3 py-1 text-xs tracking-widest uppercase">
                  Alphabetically
                </DropdownMenuLabel>
                <DropdownMenuRadioItem
                  value="alpha-asc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  A-Z
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem
                  value="alpha-desc"
                  className="focus:bg-quaternary-bg focus:text-primary-text cursor-pointer rounded-lg px-3 py-2 text-sm"
                >
                  Z-A
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Helpful Tip */}
      {filteredAndSortedItems.length > 0 && (
        <div className="bg-button-info/10 border-button-info mb-4 rounded-lg border p-3">
          <div className="text-primary-text flex items-start gap-2 text-sm">
            <Icon
              icon="emojione:light-bulb"
              className="text-button-info shrink-0 text-lg"
            />
            <span className="font-medium">
              Helpful Tip: This tab shows items you have multiple copies of,
              including items from your regular inventory and flagged duplicate
              items.
            </span>
          </div>
        </div>
      )}

      {/* Cards container with secondary background */}
      <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
        {/* Use InventoryItemsGrid - same as InventoryItems tab */}
        <InventoryItemsGrid
          filteredItems={filteredAndSortedItems.map((item) => {
            const baseItemData = itemsData.find(
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
              isDupedItem:
                (item as InventoryItem & { _isDupedItem?: boolean })
                  ._isDupedItem || false,
            };
          })}
          getUserDisplay={getUserDisplay}
          getUserAvatar={getUserAvatar}
          getHasVerifiedBadge={getHasVerifiedBadge}
          onCardClick={onItemClick}
          itemCounts={duplicateCounts}
          duplicateOrders={duplicateOrders}
          userId={initialData.user_id}
          isLoading={false}
        />
      </div>
    </div>
  );
}
