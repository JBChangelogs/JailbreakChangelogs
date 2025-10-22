"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ThemeProvider } from "@mui/material";
import React from "react";
import { fetchMissingRobloxData } from "./actions";
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
import { formatMessageDate } from "@/utils/timestamp";
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
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const forceShowErrorHandledRef = useRef<boolean>(false);
  const [robloxUsers, setRobloxUsers] = useState<Record<string, RobloxUser>>(
    initialRobloxUsers || {},
  );
  const [robloxAvatars, setRobloxAvatars] = useState(
    initialRobloxAvatars || {},
  );
  const [itemsData] = useState<Item[]>(items);
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

  // Derive active tab from robloxId to avoid setState in effect
  const effectiveActiveTab = !robloxId && activeTab === 1 ? 0 : activeTab;

  // Derive loading state to avoid setState in effects
  // Reset internal loading when data arrives or there's an error
  const isLoading =
    (internalIsLoading && !initialData && !error) || externalIsLoading || false;

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

  // Helper function to get user display name with progressive loading
  const getUserDisplay = useCallback(
    (userId: string) => {
      const user = robloxUsers[userId] || initialRobloxUsers?.[userId];
      return user?.name || user?.displayName || userId;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setInternalIsLoading(true);
    router.push(`/inventories/${searchId.trim()}`);
  };

  const formatDate = (timestamp: number) => {
    return formatMessageDate(timestamp);
  };

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
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
              <InventoryOverflowTabs
                value={effectiveActiveTab}
                onChange={(e, idx) =>
                  handleTabChange(e as unknown as React.SyntheticEvent, idx)
                }
                hasComments={Boolean(robloxId)}
              />

              {/* Tab Content */}
              <div className="mt-4">
                {effectiveActiveTab === 0 && (
                  <InventoryItems
                    initialData={currentData}
                    robloxUsers={robloxUsers}
                    robloxAvatars={robloxAvatars}
                    onItemClick={handleItemClick}
                    itemsData={itemsData}
                    isOwnInventory={isOwnInventory}
                  />
                )}

                {effectiveActiveTab === 1 && robloxId && (
                  <ChangelogComments
                    changelogId={robloxId}
                    changelogTitle={`${getUserDisplay(robloxId)}'s Inventory`}
                    type="inventory"
                    inventory={{ owner: robloxId }}
                    initialComments={initialComments}
                    initialUserMap={initialCommentUserMap}
                  />
                )}
              </div>
            </div>

            {/* Trade History Modal */}
            <TradeHistoryModal
              isOpen={showHistoryModal}
              onClose={closeHistoryModal}
              item={selectedItem}
              getUserAvatar={getUserAvatar}
              getUserDisplay={getUserDisplay}
              getUsername={(userId) => {
                const user =
                  robloxUsers[userId] || initialRobloxUsers?.[userId];
                return user?.name || userId;
              }}
              getHasVerifiedBadge={(userId) => {
                const user =
                  robloxUsers[userId] || initialRobloxUsers?.[userId];
                return Boolean(user?.hasVerifiedBadge);
              }}
              formatDate={formatDate}
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

function InventoryOverflowTabs({
  value,
  onChange,
  hasComments,
}: {
  value: number;
  onChange: (e: React.SyntheticEvent, v: number) => void;
  hasComments: boolean;
}) {
  const labels = ["Inventory Items", ...(hasComments ? ["Comments"] : [])];

  return (
    <div className="overflow-x-auto">
      <div role="tablist" className="tabs min-w-max">
        {labels.map((label, idx) => (
          <button
            key={label}
            role="tab"
            aria-selected={value === idx}
            aria-controls={`inventory-tabpanel-${idx}`}
            id={`inventory-tab-${idx}`}
            onClick={(e) => onChange(e as unknown as React.SyntheticEvent, idx)}
            className={`tab ${value === idx ? "tab-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
