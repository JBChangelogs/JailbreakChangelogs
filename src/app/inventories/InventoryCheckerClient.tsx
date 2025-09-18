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
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
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
  const isLoadingDupes = false;

  const router = useRouter();

  // Auth context and scan functionality
  const { user, isAuthenticated } = useAuthContext();
  const scanWebSocket = useScanWebSocket(robloxId || "");

  // Check if current user is viewing their own inventory
  const isOwnInventory = isAuthenticated && user?.roblox_id === robloxId;

  // Use refreshed data if available, otherwise use initial data
  const currentData = refreshedData || initialData;

  // Function to handle data refresh
  const handleDataRefresh = (newData: InventoryData) => {
    setRefreshedData(newData);
  };

  // Show toast notifications for scan status
  useEffect(() => {
    if (
      scanWebSocket.message &&
      scanWebSocket.message.includes("User not found in game")
    ) {
      toast.error(
        "User not found in game. Please join a trade server and try again.",
        {
          duration: 5000,
          position: "bottom-right",
        },
      );
    } else if (
      scanWebSocket.message &&
      scanWebSocket.message.includes("User found in game")
    ) {
      toast.success("User found in game - scan in progress!", {
        duration: 3000,
        position: "bottom-right",
      });
    } else if (
      scanWebSocket.message &&
      scanWebSocket.message.includes("Bot joined server")
    ) {
      toast.success("Bot joined server, scanning...", {
        duration: 3000,
        position: "bottom-right",
      });
    } else if (
      scanWebSocket.status === "completed" &&
      scanWebSocket.message &&
      scanWebSocket.message.includes("Added to queue")
    ) {
      toast.success(scanWebSocket.message, {
        duration: 5000,
        position: "bottom-right",
      });
    } else if (
      scanWebSocket.status === "error" &&
      scanWebSocket.error &&
      scanWebSocket.error.includes("No bots available")
    ) {
      toast.error(
        "No scan bots are currently online. Please try again later.",
        {
          duration: 5000,
          position: "bottom-right",
        },
      );
    }
  }, [scanWebSocket.message, scanWebSocket.status, scanWebSocket.error]);

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
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-600"></div>
              <div className="flex-1">
                <div className="mb-2 h-6 w-32 rounded bg-gray-600"></div>
                <div className="h-4 w-24 rounded bg-gray-600"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="mb-2 h-8 animate-pulse rounded bg-gray-600"></div>
                  <div className="mx-auto h-4 w-16 animate-pulse rounded bg-gray-600"></div>
                </div>
              ))}
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
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-400">
              Unable to Fetch Inventory Data
            </h3>
            <p className="mb-4 break-words text-gray-300">{error}</p>

            {/* Show scan request button if it's the user's own inventory */}
            {isOwnInventory ? (
              <div className="mt-4">
                <button
                  onClick={() => scanWebSocket.startScan()}
                  disabled={
                    scanWebSocket.status === "scanning" ||
                    scanWebSocket.status === "connecting" ||
                    scanWebSocket.isSlowmode
                  }
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    scanWebSocket.status === "scanning" ||
                    scanWebSocket.status === "connecting" ||
                    scanWebSocket.isSlowmode
                      ? "cursor-progress bg-gray-600 text-gray-400"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {scanWebSocket.status === "connecting" ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Connecting...
                    </>
                  ) : scanWebSocket.isSlowmode ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Cooldown ({scanWebSocket.slowmodeTimeLeft}s)
                    </>
                  ) : scanWebSocket.status === "scanning" ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {scanWebSocket.message &&
                      scanWebSocket.message.includes("Bot joined server")
                        ? "Scanning..."
                        : scanWebSocket.message &&
                            scanWebSocket.message.includes("Retrying")
                          ? "Retrying..."
                          : scanWebSocket.message &&
                              scanWebSocket.message.includes(
                                "You will be scanned when you join",
                              )
                            ? "Processing..."
                            : scanWebSocket.message || "Processing..."}
                    </>
                  ) : scanWebSocket.status === "completed" ? (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Scan Complete
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Scan Inventory
                    </>
                  )}
                </button>

                {/* Progress Bar - Only show when progress is defined and scanning */}
                {scanWebSocket.progress !== undefined &&
                  scanWebSocket.status === "scanning" && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs text-gray-400">
                        <span>Progress</span>
                        <span>{scanWebSocket.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-green-600 transition-all duration-300"
                          style={{ width: `${scanWebSocket.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                {/* OR section with alternative option */}
                <div className="mt-4 flex items-center">
                  <div className="flex-1 border-t border-gray-600"></div>
                  <span className="mx-4 text-sm text-gray-400">OR</span>
                  <div className="flex-1 border-t border-gray-600"></div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-white">
                    Wait for an automatic scan
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Join any trading server and our bots will automatically scan
                    you when they join. No manual request needed.
                  </p>
                </div>
              </div>
            ) : (
              /* Show login prompt for potential profile owner */
              <div className="mt-4 rounded-lg bg-[#2E3944] p-4">
                <p className="text-muted mb-1 text-sm font-medium">
                  Are you the owner of this profile?
                </p>
                <p className="text-sm text-[#FFFFFF]">
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
            userConnectionData={userConnectionData}
            itemsData={itemsData}
            dupedItems={dupedItems}
            isLoadingDupes={isLoadingDupes}
            onDataRefresh={handleDataRefresh}
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
