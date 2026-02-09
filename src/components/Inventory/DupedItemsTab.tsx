"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RobloxUser, Item } from "@/types";
import { InventoryItem } from "@/app/inventories/types";
import InventoryItemsGrid from "./InventoryItemsGrid";
import { mergeInventoryArrayWithMetadata } from "@/utils/inventoryMerge";
import { Icon } from "../ui/IconWrapper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DupedItemsTabProps {
  duplicates: InventoryItem[];
  robloxUsers: Record<string, RobloxUser>;
  onItemClick: (item: InventoryItem) => void;
  itemsData?: Item[];
  userId: string;
}

type SortOrder =
  | "alpha-asc"
  | "alpha-desc"
  | "created-asc"
  | "created-desc"
  | "cash-desc"
  | "cash-asc"
  | "duped-desc"
  | "duped-asc";

export default function DupedItemsTab({
  duplicates,
  robloxUsers,
  onItemClick,
  itemsData: propItemsData,
  userId,
}: DupedItemsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("duped-desc");
  const MAX_SEARCH_LENGTH = 50;
  const selectedCategoryValue = selectedCategory || "all";
  const sortLabels: Record<SortOrder, string> = {
    "created-asc": "Oldest First",
    "created-desc": "Newest First",
    "cash-desc": "Cash Value (High to Low)",
    "cash-asc": "Cash Value (Low to High)",
    "duped-desc": "Duped Value (High to Low)",
    "duped-asc": "Duped Value (Low to High)",
    "alpha-asc": "A-Z",
    "alpha-desc": "Z-A",
  };

  // Merge duplicates data with metadata from item/list endpoint
  const mergedDuplicatesData = useMemo(
    () => mergeInventoryArrayWithMetadata(duplicates, propItemsData || []),
    [duplicates, propItemsData],
  );

  const currentItemsData = useMemo(() => propItemsData || [], [propItemsData]);

  // Helper functions
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

  // Get available categories from duplicates
  const availableCategories = useMemo(() => {
    const categories = new Set(
      mergedDuplicatesData.map((item) => item.categoryTitle),
    );
    return Array.from(categories).sort();
  }, [mergedDuplicatesData]);

  // Parse numeric values for sorting
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
    let filtered = [...mergedDuplicatesData];

    // Filter by search term
    if (searchTerm.trim()) {
      const normalize = (str: string) =>
        str.toLowerCase().replace(/[^a-z0-9]/g, "");
      const tokenize = (str: string) =>
        str.toLowerCase().match(/[a-z0-9]+/g) || [];
      const splitAlphaNum = (str: string) => {
        return (str.match(/[a-z]+|[0-9]+/gi) || []).map((s) => s.toLowerCase());
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

      filtered = filtered.filter((item) => {
        const itemData = currentItemsData.find(
          (data) => data.id === item.item_id,
        );
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
      const aData = currentItemsData.find((data) => data.id === a.item_id);
      const bData = currentItemsData.find((data) => data.id === b.item_id);

      switch (sortOrder) {
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
    mergedDuplicatesData,
    searchTerm,
    selectedCategory,
    sortOrder,
    currentItemsData,
  ]);

  if (filteredAndSortedItems.length === 0 && !searchTerm && !selectedCategory) {
    return (
      <div className="border-border-primary bg-secondary-bg rounded-lg border p-8 text-center">
        <p className="text-secondary-text">
          No duplicate items found in this inventory.
        </p>
      </div>
    );
  }

  return (
    <div>
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
            className="border-border-primary bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info min-h-[56px] w-full rounded-lg border px-4 py-3 pr-10 pl-10 transition-all duration-300 focus:outline-none"
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
                className="border-border-primary bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
              className="border-border-primary bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={selectedCategoryValue}
                onValueChange={(val) =>
                  setSelectedCategory(val === "all" ? "" : val)
                }
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
                className="border-border-primary bg-secondary-bg text-primary-text focus:border-button-info focus:ring-button-info/50 hover:border-border-focus flex h-[56px] w-full items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all duration-300 focus:ring-1 focus:outline-none"
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
              className="border-border-primary bg-secondary-bg text-primary-text scrollbar-thin max-h-[320px] w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)] overflow-x-hidden overflow-y-auto rounded-xl border p-1 shadow-lg"
            >
              <DropdownMenuRadioGroup
                value={sortOrder}
                onValueChange={(val) => setSortOrder(val as SortOrder)}
              >
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
          {filteredAndSortedItems.length === 1 ? "item" : "items"}
          {searchTerm || selectedCategory
            ? ` (filtered from ${mergedDuplicatesData.length} total)`
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
              To check if an item is duped, please use our{" "}
              <Link href="/dupes" className="font-bold underline">
                Dupe Finder
              </Link>
              .
            </span>
          </div>
        </div>
      )}

      {/* Cards container with secondary background */}
      <div className="bg-secondary-bg rounded-lg p-4">
        <InventoryItemsGrid
          filteredItems={filteredAndSortedItems.map((item) => {
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
              isDupedItem: true,
            };
          })}
          getUserDisplay={getUserDisplay}
          getUserAvatar={getUserAvatar}
          getHasVerifiedBadge={getHasVerifiedBadge}
          onCardClick={onItemClick}
          userId={userId}
          isLoading={false}
        />
      </div>
    </div>
  );
}
