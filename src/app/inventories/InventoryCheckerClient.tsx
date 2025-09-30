"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ThemeProvider, Tabs, Tab, Box } from "@mui/material";
import { fetchMissingRobloxData, fetchOriginalOwnerAvatars } from "./actions";
import { ENABLE_WS_SCAN } from "@/utils/api";
import { RobloxUser, Item } from "@/types";
import { InventoryData, InventoryItem, UserConnectionData } from "./types";
import { useAuthContext } from "@/contexts/AuthContext";
import { Season } from "@/types/seasons";
import toast from "react-hot-toast";
import SearchForm from "@/components/Inventory/SearchForm";
import UserStats from "@/components/Inventory/UserStats";
import InventoryItems from "@/components/Inventory/InventoryItems";
import TradeHistoryModal from "@/components/Modals/TradeHistoryModal";
import InventoryAdSection from "@/components/Ads/InventoryAdSection";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";
import {
  showScanLoadingToast,
  updateScanLoadingToast,
  dismissScanLoadingToast,
  showScanSuccessToast,
  showScanErrorToast,
} from "@/utils/scanToasts";
import dynamic from "next/dynamic";
import { CommentData } from "@/utils/api";
import { UserData } from "@/types/auth";

const ChangelogComments = dynamic(
  () => import("@/components/PageComments/ChangelogComments"),
  {
    ssr: false,
  },
);

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
  initialComments?: CommentData[];
  initialCommentUserMap?: Record<string, UserData>;
  items?: Item[]; // Items data passed from server
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
  initialComments = [],
  initialCommentUserMap = {},
  items = [],
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
  const forceShowErrorHandledRef = useRef<boolean>(false);
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    initialRobloxUsers || {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState(
    initialRobloxAvatars || {},
  );
  const [itemsData] = useState<Item[]>(items);
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [refreshedData, setRefreshedData] = useState<InventoryData | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState(0);
  const dupedItems =
    initialDupeData && Array.isArray(initialDupeData) ? initialDupeData : [];

  const router = useRouter();

  // Auth context and scan functionality
  const { user, isAuthenticated } = useAuthContext();
  const scanWebSocket = useScanWebSocket(robloxId || "");
  const { modalState, openModal, closeModal } = useSupporterModal();

  // Check if current user is viewing their own inventory
  const isOwnInventory = isAuthenticated && user?.roblox_id === robloxId;

  // Use refreshed data if available, otherwise use initial data
  const currentData = refreshedData || initialData;

  // Function to handle data refresh
  const handleDataRefresh = async (newData: InventoryData) => {
    setRefreshedData(newData);
  };

  // Handle scan status updates (for error state scanning)
  useEffect(() => {
    if (!isOwnInventory) {
      return;
    }

    if (error && initialData) {
      return;
    }

    if (!error || initialData) {
      return;
    }

    if (scanWebSocket.status === "connecting") {
      showScanLoadingToast("Connecting to scan service...");
    }

    if (scanWebSocket.status === "scanning") {
      if (
        scanWebSocket.message &&
        scanWebSocket.message.includes("User found")
      ) {
        updateScanLoadingToast("User found in game!");
      } else if (
        scanWebSocket.message &&
        scanWebSocket.message.includes("Bot joined server")
      ) {
        updateScanLoadingToast("Bot joined server, scanning...");
      } else if (scanWebSocket.message) {
        updateScanLoadingToast(`Scanning: ${scanWebSocket.message}`);
      } else if (scanWebSocket.progress !== undefined) {
        updateScanLoadingToast(`Scanning... ${scanWebSocket.progress}%`);
      }
    }

    if (
      scanWebSocket.status === "completed" &&
      scanWebSocket.message &&
      scanWebSocket.message.includes("Added to queue")
    ) {
      dismissScanLoadingToast();
      showScanSuccessToast(scanWebSocket.message);
    }

    if (scanWebSocket.status === "error") {
      dismissScanLoadingToast();

      if (
        scanWebSocket.error &&
        scanWebSocket.error.includes("No bots available")
      ) {
        showScanErrorToast(
          "No scan bots are currently online. Please try again later.",
        );
      } else if (
        scanWebSocket.message &&
        scanWebSocket.message.includes("User not found in game")
      ) {
        showScanErrorToast(
          "User not found in game. Please join a trade server and try again.",
        );
      } else if (
        scanWebSocket.error &&
        scanWebSocket.error.includes("high enough supporter")
      ) {
        showScanErrorToast("You need to be Supporter III to use this feature.");
        const tierNames = [
          "Free",
          "Supporter I",
          "Supporter II",
          "Supporter III",
        ];
        const userTier = user?.premiumtype || 0;
        openModal({
          feature: "inventory_refresh",
          requiredTier: 3,
          currentTier: userTier,
          currentLimit: tierNames[userTier],
          requiredLimit: tierNames[3],
        });
      } else if (
        scanWebSocket.error &&
        scanWebSocket.error.includes("recent scan")
      ) {
        let message =
          "You have a recent scan. Please wait before requesting another scan.";

        if (scanWebSocket.expiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const remainingSeconds = scanWebSocket.expiresAt - now;

          if (remainingSeconds > 0) {
            let timeText;
            if (remainingSeconds < 60) {
              timeText = `${remainingSeconds} seconds`;
            } else if (remainingSeconds < 3600) {
              const minutes = Math.ceil(remainingSeconds / 60);
              timeText = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
            } else {
              const hours = Math.floor(remainingSeconds / 3600);
              const minutes = Math.ceil((remainingSeconds % 3600) / 60);
              timeText = `${hours}h ${minutes}m`;
            }
            message = `You have a recent scan. Please wait ${timeText} before requesting another scan.`;
          }
        }
        // Add small delay to ensure loading toast is fully dismissed
        setTimeout(() => {
          showScanErrorToast(message);
        }, 100);
      } else if (scanWebSocket.error) {
        showScanErrorToast(scanWebSocket.error);
      }
    }

    // Handle forceShowError flag for disabled WebSocket scanning
    if (
      scanWebSocket.forceShowError &&
      scanWebSocket.error &&
      !forceShowErrorHandledRef.current
    ) {
      console.log("[INVENTORY] Force showing error:", scanWebSocket.error);
      showScanErrorToast(scanWebSocket.error);
      scanWebSocket.resetForceShowError(); // Reset the flag
      forceShowErrorHandledRef.current = true; // Mark as handled
    }

    // Reset the handled flag when forceShowError becomes false
    if (!scanWebSocket.forceShowError) {
      forceShowErrorHandledRef.current = false;
    }
  }, [scanWebSocket, isOwnInventory, error, initialData, openModal, user]);

  // Function to handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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

  // Comments are provided server-side via initialComments prop
  // No need for client-side fetching

  // Reset activeTab when robloxId changes to ensure we don't get stuck on non-existent tabs
  // Only reset if robloxId is actually missing, not just when there are data fetching errors
  useEffect(() => {
    if (!robloxId && activeTab === 1) {
      setActiveTab(0);
    }
  }, [robloxId, activeTab]);

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

  // Items data is now passed as props from server-side, no need to fetch

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

      // Collect user IDs from trade history only (original owner avatars no longer needed)
      currentPageItems.forEach((item) => {
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
    <ThemeProvider theme={{}}>
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
                {error.includes("Server error")
                  ? "Server Error"
                  : "Unable to Fetch Inventory Data"}
              </h3>
              <p className="text-secondary-text mb-4 break-words">{error}</p>

              {/* Show scan option for profile owner or login prompt for others */}
              {isOwnInventory ? (
                <div className="border-border-primary bg-secondary-bg shadow-card-shadow mt-4 rounded-lg border p-4">
                  <div className="space-y-3">
                    <p className="text-primary-text mb-3 text-center text-sm">
                      Your inventory hasn&apos;t been scanned yet.
                    </p>
                    <div className="space-y-3">
                      <div className="text-center">
                        <p className="text-secondary-text text-sm">
                          Wait for one of our bots to randomly join your trade
                          server
                        </p>
                      </div>
                      <div className="text-secondary-text text-center text-sm font-medium">
                        OR
                      </div>
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            console.log(
                              "[INVENTORY] Request Scan button clicked",
                            );
                            console.log(
                              "[INVENTORY] Current scan status:",
                              scanWebSocket.status,
                            );
                            console.log(
                              "[INVENTORY] Current scan error:",
                              scanWebSocket.error,
                            );
                            scanWebSocket.startScan();
                          }}
                          disabled={
                            !ENABLE_WS_SCAN ||
                            scanWebSocket.status === "scanning" ||
                            scanWebSocket.status === "connecting"
                          }
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            !ENABLE_WS_SCAN ||
                            scanWebSocket.status === "scanning" ||
                            scanWebSocket.status === "connecting"
                              ? `bg-button-info-disabled text-form-button-text border-button-info-disabled ${
                                  !ENABLE_WS_SCAN
                                    ? "cursor-not-allowed"
                                    : "cursor-progress"
                                }`
                              : "bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer"
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
                              scanWebSocket.message.includes(
                                "Bot joined server",
                              )
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
                              {scanWebSocket.message &&
                              scanWebSocket.message.includes("recent scan") ? (
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
                                  {scanWebSocket.message.includes("recent scan")
                                    ? "Recent Scan Found"
                                    : scanWebSocket.message.includes(
                                          "User not found",
                                        )
                                      ? "User Not Found"
                                      : scanWebSocket.message.includes(
                                            "not in game",
                                          )
                                        ? "Not In Game"
                                        : scanWebSocket.message}
                                </>
                              ) : scanWebSocket.message &&
                                scanWebSocket.message.includes("not found") ? (
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
                                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                  </svg>
                                  User Not Found
                                </>
                              ) : !ENABLE_WS_SCAN ? (
                                "Scanning Disabled"
                              ) : (
                                "Request a Scan"
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-border-primary bg-secondary-bg shadow-card-shadow mt-4 rounded-lg border p-4">
                  <p className="text-primary-text mb-1 text-sm font-medium">
                    Are you the owner of this profile?
                  </p>
                  <p className="text-secondary-text text-sm">
                    Login to request an inventory scan.
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

            {/* Ad Section - Only show for non-premium users */}
            <InventoryAdSection className="my-6" />

            {/* Tabbed Interface */}
            <div className="mt-6">
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                className="[&_.MuiTab-root]:text-secondary-text [&_.MuiTab-root:hover]:text-primary-text [&_.MuiTab-root:hover]:bg-button-info/10 [&_.MuiTab-root.Mui-selected]:text-button-info [&_.MuiTab-root.Mui-selected]:border-button-info [&_.MuiTabs-indicator]:bg-button-info [&_.MuiTabs-scrollButtons]:text-secondary-text [&_.MuiTabs-scrollButtons:hover]:bg-button-info/10 [&_.MuiTabs-scrollButtons:hover]:text-primary-text [&_.MuiTab-root]:mr-1 [&_.MuiTab-root]:min-h-12 [&_.MuiTab-root]:rounded-t-lg [&_.MuiTab-root]:px-5 [&_.MuiTab-root]:py-3 [&_.MuiTab-root]:text-sm [&_.MuiTab-root]:font-medium [&_.MuiTab-root]:normal-case [&_.MuiTab-root]:transition-all [&_.MuiTab-root]:duration-200 [&_.MuiTab-root.Mui-selected]:border-b-2 [&_.MuiTab-root.Mui-selected]:font-semibold [&_.MuiTabs-indicator]:h-1 [&_.MuiTabs-indicator]:rounded-sm [&_.MuiTabs-scrollButtons.Mui-disabled]:opacity-30"
                sx={{
                  "& .MuiTabs-scrollButtons": {
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  },
                  "& .MuiTabScrollButton-root": {
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  },
                }}
              >
                <Tab label="Inventory Items" />
                {robloxId && <Tab label="Comments" />}
              </Tabs>

              {/* Tab Content */}
              <Box className="mt-4">
                {activeTab === 0 && (
                  <InventoryItems
                    initialData={currentData}
                    robloxUsers={robloxUsers}
                    robloxAvatars={robloxAvatars}
                    onItemClick={handleItemClick}
                    itemsData={itemsData}
                    onPageChange={handlePageChangeWithPreload}
                    isOwnInventory={isOwnInventory}
                  />
                )}

                {activeTab === 1 && robloxId && (
                  <ChangelogComments
                    changelogId={robloxId}
                    changelogTitle={`${getUserDisplay(robloxId)}'s Inventory`}
                    type="inventory"
                    inventory={{ owner: robloxId }}
                    initialComments={initialComments}
                    initialUserMap={initialCommentUserMap}
                  />
                )}
              </Box>
            </div>

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

        {/* Supporter Modal */}
        <SupporterModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          feature={modalState.feature || "inventory_refresh"}
          currentTier={modalState.currentTier || user?.premiumtype || 0}
          requiredTier={modalState.requiredTier || 3}
          currentLimit={modalState.currentLimit}
          requiredLimit={modalState.requiredLimit}
        />
      </div>
    </ThemeProvider>
  );
}
