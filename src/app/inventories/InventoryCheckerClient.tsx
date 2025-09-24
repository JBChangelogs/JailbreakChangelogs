"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { fetchMissingRobloxData, fetchOriginalOwnerAvatars } from "./actions";
import { fetchItems } from "@/utils/api";
import { RobloxUser, Item } from "@/types";
import { InventoryData, InventoryItem, UserConnectionData } from "./types";
import { useAuthContext } from "@/contexts/AuthContext";
import { Season } from "@/types/seasons";
import toast from "react-hot-toast";
import SearchForm from "@/components/Inventory/SearchForm";
import UserStats from "@/components/Inventory/UserStats";
import InventoryItems from "@/components/Inventory/InventoryItems";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";

interface InventoryCheckerClientProps {
  initialData?: InventoryData;
  robloxId?: string;
  originalSearchTerm?: string;
  robloxUsers?: Record<string, RobloxUser>;
  robloxAvatars?: Record<string, string>;
  userConnectionData?: UserConnectionData | null;
  initialDupeData?: unknown;
  currentSeason?: Season | null;
  error?: string;
  isLoading?: boolean;
  remainingUserIds?: string[];
}

export default function InventoryCheckerClient({
  initialData,
  robloxId,
  originalSearchTerm,
  robloxUsers: initialRobloxUsers,
  robloxAvatars: initialRobloxAvatars,
  userConnectionData,
  initialDupeData,
  currentSeason = null,
  error,
  isLoading: externalIsLoading,
  remainingUserIds = [],
}: InventoryCheckerClientProps) {
  const [searchId, setSearchId] = useState(
    originalSearchTerm || robloxId || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const progressiveLoadingRef = useRef<Set<string>>(new Set());
  const loadedPagesRef = useRef<Set<number>>(new Set());
  const preloadingPagesRef = useRef<Set<number>>(new Set());
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    initialRobloxUsers || {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState(
    initialRobloxAvatars || {},
  );
  const [itemsData, setItemsData] = useState<Item[]>([]);
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [refreshedData, setRefreshedData] = useState<InventoryData | null>(
    null,
  );
  const dupedItems =
    initialDupeData && Array.isArray(initialDupeData) ? initialDupeData : [];

  const router = useRouter();

  // Auth context and scan functionality
  const { user, isAuthenticated } = useAuthContext();

  // Check if current user is viewing their own inventory
  const isOwnInventory = isAuthenticated && user?.roblox_id === robloxId;

  // Use refreshed data if available, otherwise use initial data
  const currentData = refreshedData || initialData;

  // Function to handle data refresh
  const handleDataRefresh = async (newData: InventoryData) => {
    setRefreshedData(newData);
  };

  useEffect(() => {
    if (refreshedData) {
      toast.success(
        `Data refreshed successfully! Updated ${refreshedData.item_count} items`,
        {
          duration: 4000,
          position: "bottom-right",
        },
      );
    }
  }, [refreshedData]);

  // Helper function to get user display name with progressive loading
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = robloxUsers[userId] || initialRobloxUsers?.[userId];
      return user?.displayName || user?.name || userId;
    },
    [robloxUsers, initialRobloxUsers],
  );

  // Helper function to get user avatar with progressive loading
  const getUserAvatar = useCallback(
    (userId: string) => {
      const avatar = robloxAvatars[userId] || initialRobloxAvatars?.[userId];
      return avatar && typeof avatar === "string" && avatar.trim() !== ""
        ? avatar
        : null;
    },
    [robloxAvatars, initialRobloxAvatars],
  );

  // Progressive loading of missing user data (only for trade history users)
  const fetchMissingUserData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter(
        (id) => !robloxUsers[id] && !initialRobloxUsers?.[id],
      );

      if (missingIds.length === 0) {
        return;
      }

      // Check if we're already loading these IDs
      const newIds = missingIds.filter(
        (id) => !progressiveLoadingRef.current.has(id),
      );
      if (newIds.length === 0) {
        return;
      }

      // Mark as loading
      newIds.forEach((id) => progressiveLoadingRef.current.add(id));

      // Update loading state for UI
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      try {
        const result = await fetchMissingRobloxData(newIds);

        // Update state with new user data immediately
        if (result.userData && typeof result.userData === "object") {
          setRobloxUsers((prev) => ({ ...prev, ...result.userData }));
        }

        // Update state with new avatar data immediately
        if (result.avatarData && typeof result.avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...result.avatarData }));
        }
      } catch (error) {
        console.error("[INVENTORY] Failed to fetch missing user data:", error);
      } finally {
        // Remove from loading set
        newIds.forEach((id) => progressiveLoadingRef.current.delete(id));

        // Update loading state for UI
        setLoadingUserIds((prev) => {
          const newSet = new Set(prev);
          newIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [robloxUsers, initialRobloxUsers, setRobloxUsers, setRobloxAvatars],
  );

  // Fetch avatars for trade history users (not original owners since they're loaded server-side)
  const fetchTradeHistoryAvatarsData = useCallback(
    async (userIds: string[]) => {
      const missingIds = userIds.filter(
        (id) => !robloxAvatars[id] && !initialRobloxAvatars?.[id],
      );

      if (missingIds.length === 0) {
        return;
      }

      // Check if we're already loading these IDs
      const newIds = missingIds.filter(
        (id) => !progressiveLoadingRef.current.has(id),
      );
      if (newIds.length === 0) {
        return;
      }

      // Mark as loading
      newIds.forEach((id) => progressiveLoadingRef.current.add(id));

      // Update loading state for UI
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newIds.forEach((id) => newSet.add(id));
        return newSet;
      });

      try {
        const avatarData = await fetchOriginalOwnerAvatars(newIds);

        // Update state with new avatar data
        if (avatarData && typeof avatarData === "object") {
          setRobloxAvatars((prev) => ({ ...prev, ...avatarData }));
        }
      } catch (error) {
        console.error(
          "[INVENTORY] Failed to fetch trade history avatars:",
          error,
        );
      } finally {
        // Remove from loading set
        newIds.forEach((id) => progressiveLoadingRef.current.delete(id));

        // Update loading state for UI
        setLoadingUserIds((prev) => {
          const newSet = new Set(prev);
          newIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [robloxAvatars, initialRobloxAvatars, setRobloxAvatars],
  );

  // Background loading for remaining original owners (after initial 1000)
  useEffect(() => {
    if (remainingUserIds.length === 0) return;

    const loadRemainingUsers = async () => {
      const BATCH_SIZE = 100; // Load 100 users at a time
      const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay between batches

      console.log(
        `[INVENTORY] Starting background load of ${remainingUserIds.length} remaining users`,
      );

      for (let i = 0; i < remainingUserIds.length; i += BATCH_SIZE) {
        const batch = remainingUserIds.slice(i, i + BATCH_SIZE);

        try {
          console.log(
            `[INVENTORY] Loading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(remainingUserIds.length / BATCH_SIZE)}: ${batch.length} users`,
          );

          const result = await fetchMissingRobloxData(batch);

          // Update state with new user data
          if (result.userData && typeof result.userData === "object") {
            setRobloxUsers((prev) => ({ ...prev, ...result.userData }));
          }

          // Update state with new avatar data
          if (result.avatarData && typeof result.avatarData === "object") {
            setRobloxAvatars((prev) => ({ ...prev, ...result.avatarData }));
          }

          console.log(
            `[INVENTORY] Successfully loaded batch ${Math.floor(i / BATCH_SIZE) + 1}`,
          );
        } catch (error) {
          console.error(
            `[INVENTORY] Failed to load batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
            error,
          );
        }

        // Add delay between batches to avoid overwhelming the API
        if (i + BATCH_SIZE < remainingUserIds.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, DELAY_BETWEEN_BATCHES),
          );
        }
      }

      console.log(
        `[INVENTORY] Completed background loading of all remaining users`,
      );
    };

    // Start loading after a short delay to let the initial page load
    const timeoutId = setTimeout(loadRemainingUsers, 3000);

    return () => clearTimeout(timeoutId);
  }, [remainingUserIds, setRobloxUsers, setRobloxAvatars]);

  // Fetch items data for value calculations
  useEffect(() => {
    const loadItemsData = async () => {
      try {
        const items = await fetchItems();
        setItemsData(items);
      } catch (error) {
        console.error("Failed to fetch items data:", error);
      }
    };

    if (initialData?.data && initialData.data.length > 0) {
      loadItemsData();
    }
  }, [initialData]);

  // Progressive loading for trade history users and missing original owners
  const loadPageData = useCallback(
    (pageNumber: number, isPreload = false) => {
      if (!initialData?.data || initialData.data.length === 0) return;

      // Check if we've already loaded this page
      if (loadedPagesRef.current.has(pageNumber)) {
        return;
      }

      // Check if we're already preloading this page
      if (isPreload && preloadingPagesRef.current.has(pageNumber)) {
        return;
      }

      const itemsPerPage = 20;

      // Calculate which items are on the current page
      const startIndex = (pageNumber - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageItems = initialData.data.slice(startIndex, endIndex);

      const userIdsToLoad: string[] = [];
      const avatarIdsToLoad: string[] = [];

      // Collect user IDs from both trade history and original owners
      currentPageItems.forEach((item) => {
        // Check original owner data
        const originalOwnerInfo = item.info.find(
          (info) => info.title === "Original Owner",
        );
        if (
          originalOwnerInfo &&
          originalOwnerInfo.value &&
          /^\d+$/.test(originalOwnerInfo.value)
        ) {
          const originalOwnerId = originalOwnerInfo.value;
          const hasUserData =
            robloxUsers[originalOwnerId] ||
            initialRobloxUsers?.[originalOwnerId];
          const hasAvatarData =
            robloxAvatars[originalOwnerId] ||
            initialRobloxAvatars?.[originalOwnerId];

          if (!hasUserData) {
            userIdsToLoad.push(originalOwnerId);
          }
          if (!hasAvatarData) {
            avatarIdsToLoad.push(originalOwnerId);
          }
        }

        // Check trade history users
        if (item.history && item.history.length > 0) {
          item.history.forEach((trade) => {
            if (trade.UserId) {
              const tradeUserId = trade.UserId.toString();
              // Check if we already have this user's data
              const hasUserData =
                robloxUsers[tradeUserId] || initialRobloxUsers?.[tradeUserId];
              const hasAvatarData =
                robloxAvatars[tradeUserId] ||
                initialRobloxAvatars?.[tradeUserId];

              if (!hasUserData) {
                userIdsToLoad.push(tradeUserId);
              }

              if (!hasAvatarData) {
                avatarIdsToLoad.push(tradeUserId);
              }
            }
          });
        }
      });

      // Remove duplicates
      const uniqueUserIds = [...new Set(userIdsToLoad)];
      const uniqueAvatarIds = [...new Set(avatarIdsToLoad)];

      // Mark this page as loaded or preloading
      if (isPreload) {
        preloadingPagesRef.current.add(pageNumber);
      } else {
        loadedPagesRef.current.add(pageNumber);
      }

      // Only fetch if we have IDs to load
      if (uniqueUserIds.length > 0) {
        fetchMissingUserData(uniqueUserIds);
      }

      if (uniqueAvatarIds.length > 0) {
        fetchTradeHistoryAvatarsData(uniqueAvatarIds);
      }
    },
    [
      initialData?.data,
      robloxUsers,
      initialRobloxUsers,
      robloxAvatars,
      initialRobloxAvatars,
      fetchMissingUserData,
      fetchTradeHistoryAvatarsData,
    ],
  );

  // Preload next page for smoother experience
  const preloadNextPage = useCallback(
    (currentPage: number) => {
      if (!initialData?.data || initialData.data.length === 0) return;

      const itemsPerPage = 20;
      const totalPages = Math.ceil(initialData.data.length / itemsPerPage);
      const nextPage = currentPage + 1;

      // Only preload if next page exists and we haven't loaded it yet
      if (
        nextPage <= totalPages &&
        !loadedPagesRef.current.has(nextPage) &&
        !preloadingPagesRef.current.has(nextPage)
      ) {
        loadPageData(nextPage, true);
      }
    },
    [initialData?.data, loadPageData],
  );

  // Load data for page 1 initially and preload page 2 - but only after itemsData is loaded for sorting
  useEffect(() => {
    if (
      initialData?.data &&
      initialData.data.length > 0 &&
      itemsData.length > 0
    ) {
      loadPageData(1);
      // Preload page 2 for smoother experience
      setTimeout(() => preloadNextPage(1), 1000);
    }
  }, [initialData?.data, itemsData, loadPageData, preloadNextPage]);

  // Enhanced page change handler with preloading
  const handlePageChangeWithPreload = useCallback(
    (pageNumber: number) => {
      // Load current page data
      loadPageData(pageNumber);

      // Preload next page for smoother experience
      setTimeout(() => preloadNextPage(pageNumber), 500);
    },
    [loadPageData, preloadNextPage],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsLoading(true);
    router.push(`/inventories/${searchId.trim()}`);
  };

  // Reset loading state when new data is received or when there's an error
  useEffect(() => {
    if (initialData || error) {
      setIsLoading(false);
    }
  }, [initialData, error]);

  // Sync with external loading state
  useEffect(() => {
    setIsLoading(externalIsLoading || false);
  }, [externalIsLoading]);

  // Reset loading state when robloxId changes (navigation to same URL)
  useEffect(() => {
    // If we're loading and the robloxId matches our search, reset loading state
    // This handles the case where user searches for the same user again
    if (isLoading && robloxId === searchId.trim()) {
      setIsLoading(false);
    }
  }, [robloxId, isLoading, searchId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);

    // Load Roblox data for history users if not already loaded
    if (item.history && item.history.length > 0) {
      const historyUserIds: string[] = [];
      const historyAvatarIds: string[] = [];

      item.history.forEach((trade) => {
        if (trade.UserId) {
          const tradeUserId = trade.UserId.toString();

          // Check if we need user data
          const hasUserData =
            robloxUsers[tradeUserId] || initialRobloxUsers?.[tradeUserId];
          if (!hasUserData) {
            historyUserIds.push(tradeUserId);
          }

          // Check if we need avatar data
          const hasAvatarData =
            robloxAvatars[tradeUserId] || initialRobloxAvatars?.[tradeUserId];
          if (!hasAvatarData) {
            historyAvatarIds.push(tradeUserId);
          }
        }
      });

      // Remove duplicates
      const uniqueUserIds = [...new Set(historyUserIds)];
      const uniqueAvatarIds = [...new Set(historyAvatarIds)];

      // Load missing data
      if (uniqueUserIds.length > 0) {
        fetchMissingUserData(uniqueUserIds);
      }

      if (uniqueAvatarIds.length > 0) {
        fetchTradeHistoryAvatarsData(uniqueAvatarIds);
      }
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedItem(null);
  };

  if (isLoading || externalIsLoading) {
    return (
      <div className="space-y-6">
        {/* Search Form */}
        <SearchForm
          searchId={searchId}
          setSearchId={setSearchId}
          handleSearch={handleSearch}
          isLoading={isLoading}
          externalIsLoading={externalIsLoading || false}
        />

        {/* Loading Skeleton for User Data */}
        <div className="border-border-primary bg-secondary-bg min-h-[200px] rounded-lg border p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-button-secondary h-16 w-16 rounded-full"></div>
              <div className="flex-1">
                <div className="bg-button-secondary mb-2 h-6 w-32 rounded"></div>
                <div className="bg-button-secondary h-4 w-24 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <SearchForm
        searchId={searchId}
        setSearchId={setSearchId}
        handleSearch={handleSearch}
        isLoading={isLoading}
        externalIsLoading={externalIsLoading || false}
      />

      {/* Error Display */}
      {error && !initialData && (
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-status-error/10 rounded-full p-3">
                <ExclamationTriangleIcon className="text-status-error h-8 w-8" />
              </div>
            </div>
            <h3 className="text-status-error mb-2 text-lg font-semibold">
              Unable to Fetch Inventory Data
            </h3>
            <p className="text-secondary-text mb-4 break-words">{error}</p>

            {/* Show login prompt for potential profile owner */}
            {!isOwnInventory && (
              <div className="border-border-primary bg-secondary-bg shadow-card-shadow mt-4 rounded-lg border p-4">
                <p className="text-primary-text mb-1 text-sm font-medium">
                  Are you the owner of this profile?
                </p>
                <p className="text-secondary-text text-sm">
                  Login to request an inventory scan. Your inventory will be
                  automatically scanned when you join a trading server.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Stats and Inventory Items - Only show when no error and has data */}
      {!error && initialData && currentData && (
        <>
          {/* User Stats */}
          <UserStats
            initialData={currentData}
            robloxUsers={robloxUsers}
            robloxAvatars={robloxAvatars}
            userConnectionData={userConnectionData || null}
            itemsData={itemsData}
            dupedItems={dupedItems}
            onRefresh={handleDataRefresh}
            currentSeason={currentSeason}
          />

          {/* Inventory Items */}
          <InventoryItems
            initialData={currentData}
            robloxUsers={robloxUsers}
            robloxAvatars={robloxAvatars}
            onItemClick={handleItemClick}
            itemsData={itemsData}
            onPageChange={handlePageChangeWithPreload}
          />

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
        </>
      )}
    </div>
  );
}
