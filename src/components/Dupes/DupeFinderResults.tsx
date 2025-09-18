"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@mui/material";
import dynamic from "next/dynamic";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DefaultAvatar } from "@/utils/avatar";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import {
  fetchMissingRobloxData,
  fetchOriginalOwnerAvatars,
} from "@/app/inventories/actions";
import { fetchItems } from "@/utils/api";
import { formatCurrencyValue, parseCurrencyValue } from "@/utils/currency";
import {
  getItemImagePath,
  isVideoItem,
  isDriftItem,
  getDriftVideoPath,
  getVideoPath,
  handleImageError,
} from "@/utils/images";
import type { DupeFinderItem, RobloxUser, Item } from "@/types";
import ItemActionModal from "@/components/Modals/ItemActionModal";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import DisplayAd from "@/components/Ads/DisplayAd";
import AdRemovalNotice from "@/components/Ads/AdRemovalNotice";
import { useAuthContext } from "@/contexts/AuthContext";

const Select = dynamic(() => import("react-select"), { ssr: false });

const bangers = localFont({
  src: "../../../public/fonts/Bangers.ttf",
});

// Helper function to format money with precise values (matches inventory style)
const formatPreciseMoney = (money: number) => {
  if (money >= 1000000000) {
    const value = Math.floor(money / 100000000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}B`;
  } else if (money >= 1000000) {
    const value = Math.floor(money / 100000) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`;
  } else if (money >= 1000) {
    const value = Math.floor(money / 100) / 10;
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}K`;
  }
  return `$${money.toLocaleString()}`;
};

interface UserConnectionData {
  id: string;
  username: string;
  global_name: string;
  roblox_id: string | null;
  roblox_username?: string;
}

interface DupeFinderResultsProps {
  initialData: DupeFinderItem[];
  robloxId?: string;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  userConnectionData?: UserConnectionData | null;
  error?: string;
}

export default function DupeFinderResults({
  initialData,
  robloxId,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  userConnectionData,
  error,
}: DupeFinderResultsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<
    | "alpha-asc"
    | "alpha-desc"
    | "traded-desc"
    | "unique-desc"
    | "created-asc"
    | "created-desc"
    | "duplicates"
  >("created-desc");
  const [page, setPage] = useState(1);
  const [localRobloxUsers, setLocalRobloxUsers] = useState<
    Record<string, RobloxUser>
  >(initialRobloxUsers || {});
  const [localRobloxAvatars, setLocalRobloxAvatars] = useState<
    Record<string, string>
  >(initialRobloxAvatars || {});
  const [selectedItem, setSelectedItem] = useState<DupeFinderItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectLoaded, setSelectLoaded] = useState(false);
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [itemsData, setItemsData] = useState<Item[]>([]);
  const [totalDupedValue, setTotalDupedValue] = useState<number>(0);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] =
    useState<DupeFinderItem | null>(null);

  const { user } = useAuthContext();
  const currentUserPremiumType = user?.premiumtype || 0;

  const itemsPerPage = 20;
  const MAX_SEARCH_LENGTH = 50;

  const handleItemClick = (item: DupeFinderItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  // Handler for card click - show action modal
  const handleCardClick = (item: DupeFinderItem) => {
    setSelectedItemForAction(item);
    setShowActionModal(true);
  };

  // Handler for viewing trade history from modal
  const handleViewTradeHistory = () => {
    if (selectedItemForAction) {
      handleItemClick(selectedItemForAction);
    }
  };

  // Handler for closing action modal
  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedItemForAction(null);
  };

  // Load Select component and set client flag
  useEffect(() => {
    setSelectLoaded(true);
    setIsClient(true);
  }, []);

  // Fetch items data only for dupe items and calculate total duped value
  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (!isClient) return;

    const loadItemsData = async () => {
      if (!initialData || initialData.length === 0) return;

      try {
        setIsLoadingValues(true);

        // Get unique item IDs from dupe data
        const itemIds = [...new Set(initialData.map((item) => item.item_id))];

        // Fetch all items and filter to only the ones we need
        const allItems = await fetchItems();
        const relevantItems = allItems.filter((item) =>
          itemIds.includes(item.id),
        );

        setItemsData(relevantItems);

        // Calculate total duped value only for the dupe items
        let totalDuped = 0;
        initialData.forEach((dupeItem) => {
          const itemData = relevantItems.find(
            (item) => item.id === dupeItem.item_id,
          );
          if (!itemData) return;

          let dupedValue = parseCurrencyValue(itemData.duped_value);

          // If main item doesn't have duped value, check children/variants based on created date
          if ((isNaN(dupedValue) || dupedValue <= 0) && itemData.children) {
            // Get the year from the created date (from item info)
            const createdAtInfo = dupeItem.info.find(
              (info) => info.title === "Created At",
            );
            const createdYear = createdAtInfo
              ? new Date(createdAtInfo.value).getFullYear().toString()
              : null;

            // Find the child variant that matches the created year
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
                dupedValue = parseCurrencyValue(
                  childWithDupedValue.data.duped_value,
                );
              }
            }
          }

          // Only use duped values, ignore cash values
          if (!isNaN(dupedValue) && dupedValue > 0) {
            totalDuped += dupedValue;
          }
        });
        setTotalDupedValue(totalDuped);
      } catch (error) {
        console.error("Failed to fetch items data:", error);
      } finally {
        setIsLoadingValues(false);
      }
    };

    loadItemsData();
  }, [initialData, isClient]);

  // Update local state when props change
  useEffect(() => {
    setLocalRobloxUsers(initialRobloxUsers || {});
  }, [initialRobloxUsers]);

  useEffect(() => {
    setLocalRobloxAvatars(initialRobloxAvatars || {});
  }, [initialRobloxAvatars]);

  const fetchMissingUserData = useCallback(
    async (userIds: string[]) => {
      // Filter out users that are already available
      const missingIds = userIds.filter(
        (id) => !localRobloxUsers[id] && !initialRobloxUsers?.[id],
      );

      if (missingIds.length === 0) {
        return;
      }

      try {
        // Add only missing user IDs to loading state
        setLoadingUserIds((prev) => {
          const newSet = new Set(prev);
          missingIds.forEach((id) => newSet.add(id));
          return newSet;
        });

        const { userData, avatarData } =
          await fetchMissingRobloxData(missingIds);

        if (userData && Object.keys(userData).length > 0) {
          setLocalRobloxUsers((prev) => ({ ...prev, ...userData }));
        }

        if (avatarData && Object.keys(avatarData).length > 0) {
          setLocalRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch missing user data:", error);
      } finally {
        // Remove user IDs from loading state
        setLoadingUserIds((prev) => {
          const newSet = new Set(prev);
          missingIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [localRobloxUsers, initialRobloxUsers],
  );

  const fetchOriginalOwnerAvatarsData = useCallback(
    async (userIds: string[]) => {
      try {
        const avatarData = await fetchOriginalOwnerAvatars(userIds);

        if (avatarData && Object.keys(avatarData).length > 0) {
          setLocalRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error("Failed to fetch original owner avatars:", error);
      }
    },
    [],
  );

  const getUserDisplay = useCallback(
    (userId: string): string => {
      const user = localRobloxUsers[userId];
      return user?.displayName || user?.name || userId;
    },
    [localRobloxUsers],
  );

  const getUsername = useCallback(
    (userId: string): string => {
      const user = localRobloxUsers[userId];
      return user?.name || userId;
    },
    [localRobloxUsers],
  );

  const getUserAvatar = useCallback(
    (userId: string): string | null => {
      const avatar = localRobloxAvatars[userId];
      return avatar && typeof avatar === "string" && avatar.trim() !== ""
        ? avatar
        : null;
    },
    [localRobloxAvatars],
  );

  // Memoize item data lookup for better performance
  const getItemData = useCallback(
    (itemId: number) => {
      return itemsData.find((dataItem) => dataItem.id === itemId);
    },
    [itemsData],
  );

  // Progressive loading for trade history modal
  useEffect(() => {
    if (!selectedItem?.history) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    try {
      // Parse history if it's a JSON string
      const historyData =
        typeof selectedItem.history === "string"
          ? JSON.parse(selectedItem.history)
          : selectedItem.history;

      if (Array.isArray(historyData)) {
        historyData.forEach((trade) => {
          if (trade.UserId) {
            const tradeUserId = trade.UserId.toString();
            const user = localRobloxUsers[tradeUserId];
            if (!user?.displayName && !user?.name) {
              userIdsToLoad.push(tradeUserId);
            }

            const avatar = localRobloxAvatars[tradeUserId];
            if (!avatar || typeof avatar !== "string" || avatar.trim() === "") {
              avatarIdsToLoad.push(tradeUserId);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error parsing history data:", error);
    }

    if (userIdsToLoad.length > 0) {
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      fetchMissingUserData(uniqueUserIds);
    }

    if (avatarIdsToLoad.length > 0) {
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];
      fetchOriginalOwnerAvatarsData(uniqueAvatarIds);
    }
  }, [
    selectedItem?.id,
    selectedItem?.history,
    fetchMissingUserData,
    fetchOriginalOwnerAvatarsData,
    localRobloxUsers,
    localRobloxAvatars,
  ]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter and sort data with memoization
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.categoryTitle);

      return matchesSearch && matchesCategory;
    });
  }, [initialData, searchTerm, selectedCategories]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      switch (sortOrder) {
        case "duplicates":
          // Group duplicates together and sort alphabetically by item name, then by duplicate number
          const aKey = `${a.categoryTitle}-${a.title}`;
          const bKey = `${b.categoryTitle}-${b.title}`;

          // Count how many of each item exist
          const aCount = filteredData.filter(
            (item) => `${item.categoryTitle}-${item.title}` === aKey,
          ).length;
          const bCount = filteredData.filter(
            (item) => `${item.categoryTitle}-${item.title}` === bKey,
          ).length;

          // Prioritize duplicates (items with count > 1) over singles
          if (aCount > 1 && bCount === 1) return -1; // a is duplicate, b is single
          if (aCount === 1 && bCount > 1) return 1; // a is single, b is duplicate

          // If both are duplicates or both are singles, sort by item name alphabetically
          const itemNameCompare = a.title.localeCompare(b.title);
          if (itemNameCompare !== 0) return itemNameCompare;

          // If same item name, sort by creation date (oldest first) to match duplicate numbering
          const aCreated = a.info.find(
            (info) => info.title === "Created At",
          )?.value;
          const bCreated = b.info.find(
            (info) => info.title === "Created At",
          )?.value;
          if (aCreated && bCreated) {
            const aDate = new Date(aCreated);
            const bDate = new Date(bCreated);
            if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
              return aDate.getTime() - bDate.getTime();
            }
          }
          return 0;
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
  }, [filteredData, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, page, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedData.length / itemsPerPage);
  }, [sortedData.length, itemsPerPage]);

  // Check if there are any duplicates in the filtered data
  const hasDuplicates = useMemo(() => {
    const itemCounts = new Map<string, number>();
    filteredData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      itemCounts.set(key, (itemCounts.get(key) || 0) + 1);
    });
    return Array.from(itemCounts.values()).some((count) => count > 1);
  }, [filteredData]);

  // Reset sort order if duplicates option is selected but no duplicates exist
  useEffect(() => {
    if (sortOrder === "duplicates" && !hasDuplicates) {
      setSortOrder("created-desc");
    }
  }, [sortOrder, hasDuplicates]);

  // Create a map to track duplicate items
  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    paginatedData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [paginatedData]);

  // Create a map to track the order of duplicates based on creation date
  const duplicateOrders = useMemo(() => {
    const orders = new Map<string, number>();

    // Group items by name
    const itemGroups = new Map<string, DupeFinderItem[]>();
    paginatedData.forEach((item) => {
      const key = `${item.categoryTitle}-${item.title}`;
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item);
    });

    // Sort each group by creation date (oldest first) and assign numbers
    itemGroups.forEach((items) => {
      if (items.length > 1) {
        // Sort by creation date (oldest first)
        const sortedItems = items.sort((a, b) => {
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
          orders.set(item.id, index + 1);
        });
      }
    });

    return orders;
  }, [paginatedData]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  // Progressive loading for current page items
  useEffect(() => {
    if (!initialData || initialData.length === 0) return;

    const userIdsToLoad: string[] = [];
    const avatarIdsToLoad: string[] = [];

    // Only load users for items on the current page
    const currentPageStartIndex = (page - 1) * itemsPerPage;
    const currentPageItems = sortedData.slice(
      currentPageStartIndex,
      currentPageStartIndex + itemsPerPage,
    );

    currentPageItems.forEach((item) => {
      // Add current owner ID if missing
      if (item.latest_owner && /^\d+$/.test(item.latest_owner)) {
        const user = localRobloxUsers[item.latest_owner];
        if (!user?.displayName && !user?.name) {
          userIdsToLoad.push(item.latest_owner);
        }

        const avatar = localRobloxAvatars[item.latest_owner];
        if (!avatar || typeof avatar !== "string" || avatar.trim() === "") {
          avatarIdsToLoad.push(item.latest_owner);
        }
      }
    });

    // Fetch missing user data if any (deduplicate arrays)
    if (userIdsToLoad.length > 0) {
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      fetchMissingUserData(uniqueUserIds);
    }

    if (avatarIdsToLoad.length > 0) {
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];
      fetchOriginalOwnerAvatarsData(uniqueAvatarIds);
    }
  }, [
    initialData,
    page,
    itemsPerPage,
    sortedData,
    fetchMissingUserData,
    fetchOriginalOwnerAvatarsData,
    localRobloxUsers,
    localRobloxAvatars,
  ]);

  // Get unique categories
  const categories = [
    ...new Set(initialData.map((item) => item.categoryTitle)),
  ].sort();

  if (error) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-500/10 p-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-red-400">
            Search Error
          </h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!initialData || initialData.length === 0) {
    return (
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <div className="text-center">
          <div className="mb-2 text-lg font-medium text-gray-400">
            No Dupe Items Found
          </div>
          <div className="text-gray-500">
            No duped items found for this user.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div
        className={`grid gap-6 ${currentUserPremiumType === 0 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}
      >
        <div
          className={`${currentUserPremiumType === 0 ? "lg:col-span-2" : ""}`}
        >
          <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
            <h2 className="text-muted mb-4 text-xl font-semibold">
              User Information
            </h2>

            {/* Roblox User Profile */}
            <div className="mb-6 flex flex-col gap-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-4 sm:flex-row sm:items-center">
              {getUserAvatar(robloxId || "") ? (
                <Image
                  src={getUserAvatar(robloxId || "")!}
                  alt="Roblox Avatar"
                  width={64}
                  height={64}
                  className="flex-shrink-0 rounded-full bg-[#212A31]"
                />
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#37424D]">
                  <DefaultAvatar />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-muted text-lg font-bold break-words">
                  {getUserDisplay(robloxId || "")}
                </h3>
                <p className="text-muted text-sm break-words opacity-75">
                  @{getUsername(robloxId || "")}
                </p>

                {/* Connection Icons */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {/* Discord Profile - Only show if userConnectionData exists */}
                  {userConnectionData && (
                    <Tooltip
                      title="Visit Discord Profile"
                      placement="top"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: "#0F1419",
                            color: "#D3D9D4",
                            fontSize: "0.75rem",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #2E3944",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            "& .MuiTooltip-arrow": {
                              color: "#0F1419",
                            },
                          },
                        },
                      }}
                    >
                      <a
                        href={`https://discord.com/users/${userConnectionData.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5 transition-colors hover:bg-gray-500"
                      >
                        <DiscordIcon className="h-4 w-4 flex-shrink-0 text-[#5865F2]" />
                        <span className="text-sm font-medium">Discord</span>
                      </a>
                    </Tooltip>
                  )}

                  {/* Roblox Profile - Always show since we have Roblox data */}
                  <Tooltip
                    title="Visit Roblox Profile"
                    placement="top"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#0F1419",
                          color: "#D3D9D4",
                          fontSize: "0.75rem",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #2E3944",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                          "& .MuiTooltip-arrow": {
                            color: "#0F1419",
                          },
                        },
                      },
                    }}
                  >
                    <a
                      href={`https://www.roblox.com/users/${robloxId}/profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5 transition-colors hover:bg-gray-500"
                    >
                      <RobloxIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">Roblox</span>
                    </a>
                  </Tooltip>

                  {/* Website Profile - Only show if userConnectionData exists */}
                  {userConnectionData && (
                    <Tooltip
                      title="Visit Website Profile"
                      placement="top"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: "#0F1419",
                            color: "#D3D9D4",
                            fontSize: "0.75rem",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #2E3944",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                            "& .MuiTooltip-arrow": {
                              color: "#0F1419",
                            },
                          },
                        },
                      }}
                    >
                      <Link
                        href={`/users/${userConnectionData.id}`}
                        className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5 transition-colors hover:bg-gray-500"
                      >
                        <Image
                          src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                          alt="JBCL Logo"
                          width={16}
                          height={16}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <span className="text-sm font-medium">
                          Website Profile
                        </span>
                      </Link>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#37424D] bg-[#2E3944] p-4 text-center">
                <div className="text-muted mb-2 text-sm">Dupe Items Found</div>
                <Tooltip
                  title={`${initialData.length?.toLocaleString()}`}
                  placement="top"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: "#0F1419",
                        color: "#D3D9D4",
                        fontSize: "0.75rem",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #2E3944",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        "& .MuiTooltip-arrow": {
                          color: "#0F1419",
                        },
                      },
                    },
                  }}
                >
                  <div className="cursor-help text-2xl font-bold text-[#ef4444]">
                    {initialData.length?.toLocaleString()}
                  </div>
                </Tooltip>
              </div>
              <div className="rounded-lg border border-[#37424D] bg-[#2E3944] p-4 text-center">
                <div className="text-muted mb-2 text-sm">Total Duped Value</div>
                {!isClient || isLoadingValues ? (
                  <div className="animate-pulse text-2xl font-bold text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <Tooltip
                    title={`$${totalDupedValue.toLocaleString()}`}
                    placement="top"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: "#0F1419",
                          color: "#D3D9D4",
                          fontSize: "0.75rem",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #2E3944",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                          "& .MuiTooltip-arrow": {
                            color: "#0F1419",
                          },
                        },
                      },
                    }}
                  >
                    <div className="cursor-help text-2xl font-bold text-white">
                      {formatPreciseMoney(totalDupedValue)}
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ad - Takes up 1/3 of the space, only show for non-premium users */}
        {currentUserPremiumType === 0 && (
          <div className="flex flex-col lg:col-span-1">
            <div
              className="relative h-full overflow-hidden rounded-lg border border-[#2E3944] bg-[#1a2127] shadow transition-all duration-300"
              style={{ minHeight: "250px" }}
            >
              <span className="text-muted absolute top-2 left-2 z-10 rounded bg-[#212A31] px-2 py-0.5 text-xs">
                Advertisement
              </span>
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

      {/* Results */}
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <h2 className="text-muted mb-4 text-xl font-semibold">Dupe Items</h2>

        <div className="mb-4 flex flex-col gap-4">
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
              <svg
                className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-muted absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-[#FFFFFF]"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
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
                    setSelectedCategories([
                      (option as { value: string }).value,
                    ]);
                  }}
                  options={categories.map((cat) => ({
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
                        case "alpha-asc":
                          return "Name (A to Z)";
                        case "alpha-desc":
                          return "Name (Z to A)";
                        case "traded-desc":
                          return "Monthly Traded (High to Low)";
                        case "unique-desc":
                          return "Monthly Unique (High to Low)";
                        case "created-asc":
                          return "Logged On (Oldest to Newest)";
                        case "created-desc":
                          return "Logged On (Newest to Oldest)";
                        case "duplicates":
                          return "Group Duplicates";
                        default:
                          return "Random Order";
                      }
                    })(),
                  }}
                  onChange={(option) => {
                    if (!option) {
                      setSortOrder("created-desc");
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
                            | "duplicates";
                        }
                      ).value,
                    );
                  }}
                  options={[
                    {
                      label: "Date",
                      options: [
                        {
                          value: "created-desc",
                          label: "Logged On (Newest to Oldest)",
                        },
                        {
                          value: "created-asc",
                          label: "Logged On (Oldest to Newest)",
                        },
                      ],
                    },
                    ...(hasDuplicates
                      ? [
                          {
                            value: "duplicates",
                            label: "Group Duplicates",
                          },
                        ]
                      : []),
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
                  }}
                  isSearchable={false}
                />
              ) : (
                <div className="h-10 w-full animate-pulse rounded-md border border-[#2E3944] bg-[#37424D]"></div>
              )}
            </div>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-300">
            {filteredData.length} items found
          </h3>
        </div>

        {/* No Items Found Message */}
        {filteredData.length === 0 &&
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
        {(searchTerm || selectedCategories.length > 0) &&
          filteredData.length > 0 && (
            <div className="mb-4 rounded-lg border border-[#37424D] bg-[#2E3944] p-3">
              <div className="text-muted flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Active filters:</span>
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
                  Showing {filteredData.length} of {initialData.length} items
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

        {/* Pro Tip - Only show when there are results */}
        {filteredData.length > 0 && (
          <div className="mb-4 rounded-lg border border-[#5865F2] bg-[#5865F2]/10 p-3">
            <div className="flex items-center gap-2 text-sm text-[#FFFFFF]">
              <span className="text-[#5865F2]">💡</span>
              <span className="font-medium">Pro Tip:</span>
              <span>Click on any item card to view its trading history.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedData.map((item) => {
            const itemKey = `${item.categoryTitle}-${item.title}`;
            const duplicateCount = itemCounts.get(itemKey) || 1;
            const duplicateOrder = duplicateOrders.get(item.id) || 1;
            const isDuplicate = duplicateCount > 1;

            return (
              <div
                key={item.id}
                className="relative flex min-h-[400px] cursor-pointer flex-col rounded-lg border-2 border-gray-800 bg-gray-700 p-3 text-white transition-all duration-200 hover:border-gray-600 hover:shadow-lg"
                onClick={() => handleCardClick(item)}
              >
                {/* Duplicate Indicator */}
                {isDuplicate && (
                  <div className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
                    #{duplicateOrder}
                  </div>
                )}

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

                {/* Item Image */}
                <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg bg-[#212A31]">
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
                      {item.timesTraded.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">MONTHLY UNIQUE</div>
                    <div className="text-xl font-bold">
                      {item.uniqueCirculation.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">CURRENT OWNER</div>
                    <div className="text-xl font-bold italic">
                      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#2E3944] bg-[#212A31]">
                          {getUserAvatar(item.latest_owner) ? (
                            <Image
                              src={getUserAvatar(item.latest_owner)!}
                              alt="Current Owner Avatar"
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <DefaultAvatar />
                          )}
                        </div>
                        <a
                          href={`https://www.roblox.com/users/${item.latest_owner}/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-center break-words text-blue-300 transition-colors hover:text-blue-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {getUserDisplay(item.latest_owner)}
                        </a>
                      </div>
                    </div>
                  </div>
                  {/* Duped Value */}
                  {(() => {
                    const itemData = getItemData(item.item_id);
                    if (itemData) {
                      let dupedValue = itemData.duped_value;

                      // If main item doesn't have duped value, check children/variants based on created date
                      if (
                        (dupedValue === null || dupedValue === "N/A") &&
                        itemData.children
                      ) {
                        // Get the year from the created date (from item info)
                        const createdAtInfo = item.info.find(
                          (info) => info.title === "Created At",
                        );
                        const createdYear = createdAtInfo
                          ? new Date(createdAtInfo.value)
                              .getFullYear()
                              .toString()
                          : null;

                        // Find the child variant that matches the created year
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
                          dupedValue = matchingChild.data.duped_value;
                        }
                      }

                      return (
                        <div>
                          <div className="text-sm opacity-90">DUPED VALUE</div>
                          <Tooltip
                            title={
                              dupedValue === null || dupedValue === "N/A"
                                ? "N/A"
                                : `$${parseCurrencyValue(dupedValue).toLocaleString()}`
                            }
                            placement="top"
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: "#0F1419",
                                  color: "#D3D9D4",
                                  fontSize: "0.75rem",
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid #2E3944",
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                  "& .MuiTooltip-arrow": {
                                    color: "#0F1419",
                                  },
                                },
                              },
                            }}
                          >
                            <div className="cursor-help text-xl font-bold text-white">
                              {dupedValue === null || dupedValue === "N/A"
                                ? "N/A"
                                : formatCurrencyValue(
                                    parseCurrencyValue(dupedValue),
                                  )}
                            </div>
                          </Tooltip>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <div className="text-sm opacity-90">DUPED VALUE</div>
                        <Tooltip
                          title="N/A"
                          placement="top"
                          arrow
                          slotProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: "#0F1419",
                                color: "#D3D9D4",
                                fontSize: "0.75rem",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #2E3944",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                "& .MuiTooltip-arrow": {
                                  color: "#0F1419",
                                },
                              },
                            },
                          }}
                        >
                          <div className="cursor-help text-xl font-bold text-white">
                            N/A
                          </div>
                        </Tooltip>
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-sm opacity-90">LOGGED ON</div>
                    <div className="text-xl font-bold">
                      {formatDateOnly(item.logged_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">CREATED AT</div>
                    <div className="text-xl font-bold">
                      {(() => {
                        const createdAtInfo = item.info.find(
                          (info) => info.title === "Created At",
                        );
                        return createdAtInfo
                          ? formatDateOnly(
                              new Date(createdAtInfo.value).getTime() / 1000,
                            )
                          : "N/A";
                      })()}
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

        {/* Trade History Modal */}
        <TradeHistoryModal
          isOpen={showHistoryModal}
          onClose={closeHistoryModal}
          item={selectedItem}
          getUserAvatar={getUserAvatar}
          getUserDisplay={getUserDisplay}
          formatDate={formatDate}
          loadingUserIds={loadingUserIds}
        />

        {/* Item Action Modal */}
        <ItemActionModal
          isOpen={showActionModal}
          onClose={closeActionModal}
          item={selectedItemForAction}
          onViewTradeHistory={handleViewTradeHistory}
        />
      </div>
    </div>
  );
}
