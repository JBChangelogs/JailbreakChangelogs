"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@mui/material";
import Image from "next/image";
import dynamic from "next/dynamic";
import localFont from "next/font/local";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";
import {
  fetchMissingRobloxData,
  fetchOriginalOwnerAvatars,
} from "@/app/inventories/actions";
import { RobloxUser, Item } from "@/types";
import { formatCurrencyValue, parseCurrencyValue } from "@/utils/currency";

const Select = dynamic(() => import("react-select"), { ssr: false });

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface InventoryItem {
  tradePopularMetric: number | null;
  item_id: number;
  level: number | null;
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  history?: TradeHistoryEntry[];
}

interface InventoryData {
  user_id: string;
  data: InventoryItem[];
  item_count: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
  bot_id: string;
  scan_count: number;
  created_at: number;
  updated_at: number;
}

interface InventoryItemsProps {
  initialData: InventoryData;
  robloxUsers: Record<string, RobloxUser>;
  robloxAvatars: Record<string, string>;
  onItemClick: (item: InventoryItem) => void;
  itemsData?: Item[];
}

export default function InventoryItems({
  initialData,
  robloxUsers,
  robloxAvatars,
  onItemClick,
  itemsData: propItemsData,
}: InventoryItemsProps) {
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
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [localRobloxUsers, setLocalRobloxUsers] =
    useState<Record<string, RobloxUser>>(robloxUsers);
  const [localRobloxAvatars, setLocalRobloxAvatars] =
    useState<Record<string, string>>(robloxAvatars);
  const [itemsData, setItemsData] = useState<Item[]>(propItemsData || []);

  const MAX_SEARCH_LENGTH = 50;
  const itemsPerPage = 20;

  // Helper function to parse cash value strings for totals (returns 0 for N/A)
  const parseCashValueForTotal = (value: string | null): number => {
    if (value === null || value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    if (value.toLowerCase().includes("b")) return num * 1000000000;
    return num;
  };

  // Helper function to parse duped value strings for totals (returns 0 for N/A)
  const parseDupedValueForTotal = (value: string | null): number => {
    if (value === null || value === "N/A") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (value.toLowerCase().includes("k")) return num * 1000;
    if (value.toLowerCase().includes("m")) return num * 1000000;
    if (value.toLowerCase().includes("b")) return num * 1000000000;
    return num;
  };

  // Load Select component
  useEffect(() => {
    setSelectLoaded(true);
  }, []);

  // Update itemsData when prop changes
  useEffect(() => {
    if (propItemsData) {
      setItemsData(propItemsData);
    }
  }, [propItemsData]);

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(robloxUsers);
    setLocalRobloxAvatars(robloxAvatars);
  }, [robloxUsers, robloxAvatars]);

  // Helper function to get user display name
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = localRobloxUsers[userId];
      return user?.displayName || user?.name || userId;
    },
    [localRobloxUsers],
  );

  // Helper function to get user avatar
  const getUserAvatar = useCallback(
    (userId: string) => {
      const avatar = localRobloxAvatars[userId];
      return avatar && typeof avatar === "string" && avatar.trim() !== ""
        ? avatar
        : null;
    },
    [localRobloxAvatars],
  );

  // Progressive loading of missing user data
  const fetchMissingUserData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter(
        (id) => !localRobloxUsers[id] && !robloxUsers[id],
      );

      if (missingIds.length === 0) return;

      try {
        const result = await fetchMissingRobloxData(missingIds);

        // Update state with new user data
        if (result.userData && typeof result.userData === "object") {
          setLocalRobloxUsers((prev) => ({ ...prev, ...result.userData }));
        }

        // Update state with new avatar data
        if (result.avatarData && typeof result.avatarData === "object") {
          setLocalRobloxAvatars((prev) => ({ ...prev, ...result.avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch missing user data:", error);
      }
    },
    [localRobloxUsers, robloxUsers],
  );

  // Fetch avatars for original owners separately
  const fetchOriginalOwnerAvatarsData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter(
        (id) => !localRobloxAvatars[id] && !robloxAvatars[id],
      );

      if (missingIds.length === 0) return;

      try {
        const avatarData = await fetchOriginalOwnerAvatars(missingIds);

        // Update state with new avatar data
        if (avatarData && typeof avatarData === "object") {
          setLocalRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch original owner avatars:", error);
      }
    },
    [localRobloxAvatars, robloxAvatars],
  );

  // Helper function to get Roblox user display name
  const getRobloxUserDisplay = (robloxId: string) => {
    return getUserDisplay(robloxId);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Handle filter toggle with artificial delay
  const handleOriginalFilterToggle = (checked: boolean) => {
    setIsFiltering(true);
    setShowOnlyOriginal(checked);

    // Add artificial delay to show loading state
    setTimeout(() => {
      setIsFiltering(false);
    }, 300); // 300ms delay
  };

  // Reset page when search term, filter, categories, or sort order change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, showOnlyOriginal, selectedCategories, sortOrder]);

  // Filter inventory items based on search term, original owner filter, and category filter
  const filteredItems = useMemo(() => {
    if (!initialData) {
      return [];
    }

    let items = initialData.data;

    // Apply original owner filter
    if (showOnlyOriginal) {
      items = items.filter((item) => item.isOriginalOwner);
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      items = items.filter((item) =>
        selectedCategories.includes(item.categoryTitle),
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      items = items.filter((item) => {
        // Search in item title
        if (item.title.toLowerCase().includes(searchLower)) return true;

        // Search in category title
        if (item.categoryTitle.toLowerCase().includes(searchLower)) return true;

        // Search in season (if exists)
        if (item.season && item.season.toString().includes(searchLower))
          return true;

        // Search in level (if exists)
        if (item.level && item.level.toString().includes(searchLower))
          return true;

        // Search in original owner status
        if (item.isOriginalOwner && searchLower.includes("original"))
          return true;
        if (!item.isOriginalOwner && searchLower.includes("not original"))
          return true;

        return false;
      });
    }

    // Apply sorting
    items = items.sort((a, b) => {
      switch (sortOrder) {
        case "random":
          return Math.random() - 0.5;
        case "duplicates":
          const categoryCompare = a.categoryTitle.localeCompare(
            b.categoryTitle,
          );
          if (categoryCompare !== 0) return categoryCompare;
          return a.title.localeCompare(b.title);
        case "alpha-asc":
          return a.title.localeCompare(b.title);
        case "alpha-desc":
          return b.title.localeCompare(a.title);
        case "traded-desc":
          return (b.timesTraded || 0) - (a.timesTraded || 0);
        case "unique-desc":
          return (b.uniqueCirculation || 0) - (a.uniqueCirculation || 0);
        case "created-asc":
          const aCreatedAt = a.info.find(
            (info) => info.title === "Created At",
          )?.value;
          const bCreatedAt = b.info.find(
            (info) => info.title === "Created At",
          )?.value;
          if (!aCreatedAt || !bCreatedAt) return 0;
          return (
            new Date(aCreatedAt).getTime() - new Date(bCreatedAt).getTime()
          );
        case "created-desc":
          const aCreatedAtDesc = a.info.find(
            (info) => info.title === "Created At",
          )?.value;
          const bCreatedAtDesc = b.info.find(
            (info) => info.title === "Created At",
          )?.value;
          if (!aCreatedAtDesc || !bCreatedAtDesc) return 0;
          return (
            new Date(bCreatedAtDesc).getTime() -
            new Date(aCreatedAtDesc).getTime()
          );
        case "cash-desc":
          const aItemData = itemsData.find((item) => item.id === a.item_id);
          const bItemData = itemsData.find((item) => item.id === b.item_id);
          const aCashValue = aItemData
            ? parseCashValueForTotal(aItemData.cash_value)
            : 0;
          const bCashValue = bItemData
            ? parseCashValueForTotal(bItemData.cash_value)
            : 0;
          return bCashValue - aCashValue;
        case "cash-asc":
          const aItemDataAsc = itemsData.find((item) => item.id === a.item_id);
          const bItemDataAsc = itemsData.find((item) => item.id === b.item_id);
          const aCashValueAsc = aItemDataAsc
            ? parseCashValueForTotal(aItemDataAsc.cash_value)
            : 0;
          const bCashValueAsc = bItemDataAsc
            ? parseCashValueForTotal(bItemDataAsc.cash_value)
            : 0;
          return aCashValueAsc - bCashValueAsc;
        case "duped-desc":
          const aItemDataDupedDesc = itemsData.find(
            (item) => item.id === a.item_id,
          );
          const bItemDataDupedDesc = itemsData.find(
            (item) => item.id === b.item_id,
          );
          const aDupedValueDesc = aItemDataDupedDesc
            ? parseDupedValueForTotal(aItemDataDupedDesc.duped_value)
            : 0;
          const bDupedValueDesc = bItemDataDupedDesc
            ? parseDupedValueForTotal(bItemDataDupedDesc.duped_value)
            : 0;
          return bDupedValueDesc - aDupedValueDesc;
        case "duped-asc":
          const aItemDataDupedAsc = itemsData.find(
            (item) => item.id === a.item_id,
          );
          const bItemDataDupedAsc = itemsData.find(
            (item) => item.id === b.item_id,
          );
          const aDupedValueAsc = aItemDataDupedAsc
            ? parseDupedValueForTotal(aItemDataDupedAsc.duped_value)
            : 0;
          const bDupedValueAsc = bItemDataDupedAsc
            ? parseDupedValueForTotal(bItemDataDupedAsc.duped_value)
            : 0;
          return aDupedValueAsc - bDupedValueAsc;

        default:
          return Math.random() - 0.5;
      }
    });

    return items;
  }, [
    initialData,
    searchTerm,
    showOnlyOriginal,
    selectedCategories,
    sortOrder,
    itemsData,
  ]);

  // Get unique categories from the data
  const availableCategories = useMemo(() => {
    if (!initialData) return [];
    const categories = [
      ...new Set(initialData.data.map((item) => item.categoryTitle)),
    ];
    return categories.sort();
  }, [initialData]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Progressive loading for current page items
  useEffect(() => {
    if (!paginatedItems || paginatedItems.length === 0) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    paginatedItems.forEach((item) => {
      const originalOwnerInfo = item.info.find(
        (info) => info.title === "Original Owner",
      );

      // Add original owner ID if missing
      if (originalOwnerInfo?.value && /^\d+$/.test(originalOwnerInfo.value)) {
        const ownerId = originalOwnerInfo.value;
        if (!getUserDisplay(ownerId) || getUserDisplay(ownerId) === ownerId) {
          userIdsToLoad.push(ownerId);
        }

        // Fetch avatars for original owners as well
        if (!getUserAvatar(ownerId)) {
          avatarIdsToLoad.push(ownerId);
        }
      }

      // Add trade history user IDs if missing
      if (item.history && item.history.length > 0) {
        item.history.forEach((trade) => {
          if (trade.UserId) {
            const tradeUserId = trade.UserId.toString();
            if (
              !getUserDisplay(tradeUserId) ||
              getUserDisplay(tradeUserId) === tradeUserId
            ) {
              userIdsToLoad.push(tradeUserId);
            }

            // Fetch avatars for all trade history users
            if (!getUserAvatar(tradeUserId)) {
              avatarIdsToLoad.push(tradeUserId);
            }
          }
        });
      }
    });

    // Fetch missing user data if any
    if (userIdsToLoad.length > 0) {
      fetchMissingUserData(userIdsToLoad);
    }

    // Fetch avatars for original owners and trade history users
    if (avatarIdsToLoad.length > 0) {
      fetchOriginalOwnerAvatarsData(avatarIdsToLoad);
    }
  }, [
    paginatedItems,
    initialData?.item_count,
    fetchMissingUserData,
    fetchOriginalOwnerAvatarsData,
    getUserDisplay,
    getUserAvatar,
    initialData,
  ]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  // Empty state: no inventory items
  if (
    !initialData ||
    !initialData.data ||
    initialData.item_count === 0 ||
    initialData.data.length === 0
  ) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
        <h2 className="text-muted mb-4 text-xl font-semibold">
          Inventory Items
        </h2>
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2E3944]">
            <svg
              className="text-muted h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-6-4h6M7 7h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"
              />
            </svg>
          </div>
          <p className="text-muted">
            This user has no items in their Jailbreak inventory.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
      <h2 className="text-muted mb-4 text-xl font-semibold">Inventory Items</h2>

      <div className="mb-4 flex flex-col gap-4">
        {/* Original Owner Filter */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={showOnlyOriginal}
            onChange={(e) => handleOriginalFilterToggle(e.target.checked)}
            className="h-4 w-4 rounded border-[#2E3944] bg-[#37424D] text-[#5865F2] focus:ring-2 focus:ring-[#5865F2]"
          />
          <span className="text-muted text-sm whitespace-nowrap">
            Original Items Only
          </span>
        </label>

        {/* Search, Category, and Sort Filters - Side by Side */}
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          {/* Search Bar - First */}
          <div className="relative w-full sm:w-1/3">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxLength={MAX_SEARCH_LENGTH}
              className="text-muted w-full rounded-lg border border-[#2E3944] bg-[#37424D] px-3 py-2 pr-10 pl-10 placeholder-[#D3D9D4] shadow-sm focus:border-[#5865F2] focus:outline-none"
            />
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
                aria-label="Clear search"
              >
                <XMarkIcon />
              </button>
            )}
          </div>

          {/* Category Filter - Second */}
          <div className="w-full sm:w-1/3">
            {selectLoaded ? (
              <Select
                value={
                  selectedCategories.length > 0
                    ? {
                        value: selectedCategories[0],
                        label: selectedCategories[0],
                      }
                    : null
                }
                onChange={(option) => {
                  if (!option) {
                    setSelectedCategories([]);
                    return;
                  }
                  setSelectedCategories([(option as { value: string }).value]);
                }}
                options={availableCategories.map((cat) => ({
                  value: cat,
                  label: cat,
                }))}
                classNamePrefix="react-select"
                className="w-full"
                isMulti={false}
                isClearable={true}
                placeholder="Filter by category..."
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#37424D",
                    borderColor: "#2E3944",
                    color: "#D3D9D4",
                  }),
                  singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#37424D",
                    color: "#D3D9D4",
                    zIndex: 3000,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#5865F2"
                      : state.isFocused
                        ? "#2E3944"
                        : "#37424D",
                    color:
                      state.isSelected || state.isFocused
                        ? "#FFFFFF"
                        : "#D3D9D4",
                    "&:active": {
                      backgroundColor: "#124E66",
                      color: "#FFFFFF",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: "#D3D9D4",
                    "&:hover": {
                      color: "#FFFFFF",
                    },
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#D3D9D4",
                  }),
                }}
                isSearchable={false}
              />
            ) : (
              <div className="h-10 w-full animate-pulse rounded-md border border-[#2E3944] bg-[#37424D]"></div>
            )}
          </div>

          {/* Sort Filter - Third */}
          <div className="w-full sm:w-1/3">
            {selectLoaded ? (
              <Select
                value={{
                  value: sortOrder,
                  label: (() => {
                    switch (sortOrder) {
                      case "random":
                        return "Random Order";
                      case "duplicates":
                        return "Group Duplicates";
                      case "alpha-asc":
                        return "Name (A to Z)";
                      case "alpha-desc":
                        return "Name (Z to A)";
                      case "traded-desc":
                        return "Monthly Traded (High to Low)";
                      case "unique-desc":
                        return "Monthly Unique (High to Low)";
                      case "created-asc":
                        return "Created On (Oldest to Newest)";
                      case "created-desc":
                        return "Created On (Newest to Oldest)";
                      case "cash-desc":
                        return "Cash Value (High to Low)";
                      case "cash-asc":
                        return "Cash Value (Low to High)";
                      case "duped-desc":
                        return "Duped Value (High to Low)";
                      case "duped-asc":
                        return "Duped Value (Low to High)";
                      default:
                        return "Random Order";
                    }
                  })(),
                }}
                onChange={(option) => {
                  if (!option) {
                    setSortOrder("random");
                    return;
                  }
                  setSortOrder(
                    (
                      option as {
                        value:
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
                          | "duped-asc";
                      }
                    ).value,
                  );
                }}
                options={[
                  {
                    label: "Random",
                    options: [{ value: "random", label: "Random Order" }],
                  },
                  {
                    label: "Duplicates",
                    options: [
                      { value: "duplicates", label: "Group Duplicates" },
                    ],
                  },
                  {
                    label: "Alphabetically",
                    options: [
                      { value: "alpha-asc", label: "Name (A to Z)" },
                      { value: "alpha-desc", label: "Name (Z to A)" },
                    ],
                  },
                  {
                    label: "Activity",
                    options: [
                      {
                        value: "traded-desc",
                        label: "Monthly Traded (High to Low)",
                      },
                      {
                        value: "unique-desc",
                        label: "Monthly Unique (High to Low)",
                      },
                    ],
                  },
                  {
                    label: "Value",
                    options: [
                      { value: "cash-desc", label: "Cash Value (High to Low)" },
                      { value: "cash-asc", label: "Cash Value (Low to High)" },
                      {
                        value: "duped-desc",
                        label: "Duped Value (High to Low)",
                      },
                      {
                        value: "duped-asc",
                        label: "Duped Value (Low to High)",
                      },
                    ],
                  },
                  {
                    label: "Date",
                    options: [
                      {
                        value: "created-desc",
                        label: "Created On (Newest to Oldest)",
                      },
                      {
                        value: "created-asc",
                        label: "Created On (Oldest to Newest)",
                      },
                    ],
                  },
                ]}
                classNamePrefix="react-select"
                className="w-full"
                isMulti={false}
                isClearable={true}
                placeholder="Sort by..."
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#37424D",
                    borderColor: "#2E3944",
                    color: "#D3D9D4",
                  }),
                  singleValue: (base) => ({ ...base, color: "#D3D9D4" }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#37424D",
                    color: "#D3D9D4",
                    zIndex: 3000,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#5865F2"
                      : state.isFocused
                        ? "#2E3944"
                        : "#37424D",
                    color:
                      state.isSelected || state.isFocused
                        ? "#FFFFFF"
                        : "#D3D9D4",
                    "&:active": {
                      backgroundColor: "#124E66",
                      color: "#FFFFFF",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: "#D3D9D4",
                    "&:hover": {
                      color: "#FFFFFF",
                    },
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#D3D9D4",
                  }),
                }}
                isSearchable={false}
              />
            ) : (
              <div className="h-10 w-full animate-pulse rounded-md border border-[#2E3944] bg-[#37424D]"></div>
            )}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 &&
        (searchTerm || selectedCategories.length > 0) && (
          <div className="text-muted py-8 text-center">
            <p className="break-words">
              No items found
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedCategories.length > 0 && ` in selected categories`}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-[#5865F2] hover:text-[#4752C4] hover:underline"
                >
                  Clear search
                </button>
              )}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-[#5865F2] hover:text-[#4752C4] hover:underline"
                >
                  Clear categories
                </button>
              )}
            </div>
          </div>
        )}

      {/* Filter Summary - Only show when there are items */}
      {(searchTerm || selectedCategories.length > 0 || showOnlyOriginal) &&
        filteredItems.length > 0 && (
          <div className="mb-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-3">
            <div className="text-muted flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">Active filters:</span>
              {showOnlyOriginal && (
                <span className="rounded-md bg-[#5865F2] px-2 py-1 text-xs text-white">
                  Original Items Only
                </span>
              )}
              {selectedCategories.length > 0 && (
                <span className="rounded-md bg-[#5865F2] px-2 py-1 text-xs text-white">
                  Category: {selectedCategories[0]}
                </span>
              )}
              {searchTerm && (
                <span className="rounded-md bg-[#5865F2] px-2 py-1 text-xs break-words text-white">
                  Search: &quot;{searchTerm}&quot;
                </span>
              )}
              <span className="text-xs opacity-75">
                Showing {filteredItems.length} of {initialData?.item_count || 0}{" "}
                items
              </span>
            </div>
          </div>
        )}

      {/* Top Pagination */}
      {totalPages > 1 && (
        <div className="mb-6 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#D3D9D4",
                "&.Mui-selected": {
                  backgroundColor: "#5865F2",
                  "&:hover": {
                    backgroundColor: "#4752C4",
                  },
                },
                "&:hover": {
                  backgroundColor: "#2E3944",
                },
              },
            }}
          />
        </div>
      )}

      {/* Loading Spinner */}
      {isFiltering && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="h-8 w-8 animate-spin text-[#5865F2]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-muted text-sm">Filtering items...</p>
          </div>
        </div>
      )}

      {/* Items Grid - Only show when not filtering */}
      {!isFiltering && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedItems.map((item) => {
            const isOriginalOwner = item.isOriginalOwner;
            const originalOwnerInfo = item.info.find(
              (info) => info.title === "Original Owner",
            );

            return (
              <div
                key={item.id}
                className={`relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border-2 p-3 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                  isOriginalOwner
                    ? "border-yellow-400 bg-yellow-600/30 backdrop-blur-sm"
                    : "border-gray-800 bg-gray-700"
                }`}
                onClick={() => onItemClick(item)}
              >
                {/* Title */}
                <div className="mb-4 text-left">
                  <p
                    className={`${bangers.className} text-md mb-1 tracking-wide text-gray-300`}
                  >
                    {item.categoryTitle}
                  </p>
                  <h2
                    className={`${bangers.className} text-2xl tracking-wide break-words`}
                  >
                    {item.title}
                  </h2>
                </div>

                {/* Item Image - Always show container for consistent layout */}
                <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-[#212A31]">
                  {!["Brakes"].includes(item.categoryTitle) ? (
                    isVideoItem(item.title) ? (
                      <video
                        src={getVideoPath(item.categoryTitle, item.title)}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                      />
                    ) : isDriftItem(item.categoryTitle) ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={getItemImagePath(
                            item.categoryTitle,
                            item.title,
                            true,
                          )}
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={handleImageError}
                        />
                        <video
                          src={getDriftVideoPath(item.title)}
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 hover:opacity-100"
                          muted
                          playsInline
                          loop
                        />
                      </div>
                    ) : (
                      <Image
                        src={getItemImagePath(
                          item.categoryTitle,
                          item.title,
                          true,
                        )}
                        alt={item.title}
                        fill
                        className="object-cover"
                        onError={handleImageError}
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg
                          className="mx-auto mb-2 h-12 w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm">No Image</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="flex flex-1 flex-col justify-center space-y-2 text-center">
                  <div>
                    <div className="text-sm opacity-90">MONTHLY TRADED</div>
                    <div className="text-xl font-bold">
                      {formatNumber(item.timesTraded)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">MONTHLY UNIQUE</div>
                    <div className="text-xl font-bold">
                      {formatNumber(item.uniqueCirculation)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">ORIGINAL OWNER</div>
                    <div className="text-xl font-bold italic">
                      {originalOwnerInfo ? (
                        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                          {/* Always show avatar container - use placeholder when no avatar available */}
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                            {(isOriginalOwner &&
                              getUserAvatar(initialData?.user_id || "")) ||
                            (!isOriginalOwner &&
                              getUserAvatar(originalOwnerInfo.value)) ? (
                              <Image
                                src={
                                  isOriginalOwner
                                    ? getUserAvatar(initialData?.user_id || "")!
                                    : getUserAvatar(originalOwnerInfo.value)!
                                }
                                alt="Original Owner Avatar"
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <svg
                                className="text-muted h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            )}
                          </div>
                          <a
                            href={`https://www.roblox.com/users/${isOriginalOwner ? initialData?.user_id : originalOwnerInfo.value}/profile`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-center break-words text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                          >
                            {isOriginalOwner
                              ? getRobloxUserDisplay(initialData?.user_id || "")
                              : getRobloxUserDisplay(originalOwnerInfo.value)}
                          </a>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </div>
                  {/* Cash and Duped Values */}
                  {(() => {
                    const itemData = itemsData.find(
                      (dataItem) => dataItem.id === item.item_id,
                    );
                    if (itemData) {
                      return (
                        <>
                          <div>
                            <div className="text-sm opacity-90">CASH VALUE</div>
                            <div className="text-xl font-bold text-white">
                              {itemData.cash_value === null ||
                              itemData.cash_value === "N/A"
                                ? "N/A"
                                : formatCurrencyValue(
                                    parseCurrencyValue(itemData.cash_value),
                                  )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm opacity-90">
                              DUPED VALUE
                            </div>
                            <div className="text-xl font-bold text-white">
                              {itemData.duped_value === null ||
                              itemData.duped_value === "N/A"
                                ? "N/A"
                                : formatCurrencyValue(
                                    parseCurrencyValue(itemData.duped_value),
                                  )}
                            </div>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                  <div>
                    <div className="text-sm opacity-90">CREATED ON</div>
                    <div className="text-xl font-bold">
                      {item.info.find((info) => info.title === "Created At")
                        ?.value || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Season and Level badges - always show container for consistent layout */}
                <div className="mt-3 flex min-h-[40px] justify-center gap-2 border-t border-white/20 pt-3">
                  {item.season && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-600 shadow-lg">
                      <span className="text-xs font-bold text-white">
                        S{item.season}
                      </span>
                    </div>
                  )}
                  {item.level && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-400 bg-green-600 shadow-lg">
                      <span className="text-xs font-bold text-white">
                        L{item.level}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#D3D9D4",
                "&.Mui-selected": {
                  backgroundColor: "#5865F2",
                  "&:hover": {
                    backgroundColor: "#4752C4",
                  },
                },
                "&:hover": {
                  backgroundColor: "#2E3944",
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
