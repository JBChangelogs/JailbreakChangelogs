"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { InventoryData } from "@/app/inventories/types";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import SupporterModal from "@/components/Modals/SupporterModal";
import toast from "react-hot-toast";

interface UserRefreshSectionProps {
  currentData: InventoryData | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  refreshedData: InventoryData | null;
}

export default function UserRefreshSection({
  currentData,
  isRefreshing,
  onRefresh,
  refreshedData,
}: UserRefreshSectionProps) {
  const { user, isAuthenticated, setShowLoginModal } = useAuthContext();
  const { modalState, openModal, closeModal } = useSupporterModal();
  const scanWebSocket = useScanWebSocket(currentData?.user_id || "");

  // Check if current user is viewing their own inventory
  const isOwnInventory =
    isAuthenticated && user?.roblox_id === currentData?.user_id;

  const isDataFresh = () => {
    if (!currentData) return false;
    const now = Date.now() / 1000;
    const dataAge = now - currentData.updated_at;
    return dataAge < 300; // 5 minutes
  };

  // Check if user has access to refresh feature (requires Supporter II+)
  const checkRefreshAccess = () => {
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      return false;
    }

    const userTier = user.premiumtype || 0;
    if (userTier < 2) {
      openModal({
        feature: "inventory_refresh",
        currentTier: userTier,
        requiredTier: 2,
        currentLimit:
          userTier === 0 ? "Free" : userTier === 1 ? "Supporter I" : "Unknown",
        requiredLimit: "Supporter II",
      });
      return false;
    }
    return true;
  };

  const handleRefresh = () => {
    if (isRefreshing) return;

    // Check if user has access to refresh feature
    if (!checkRefreshAccess()) return;

    onRefresh();
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

  return (
    <>
      {/* Scan Button or Login Prompt */}
      {isOwnInventory ? (
        <div className="mt-4 space-y-3">
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 lg:flex-row lg:gap-3">
            <button
              onClick={scanWebSocket.startScan}
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

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isDataFresh()}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isRefreshing
                  ? "cursor-progress bg-[#37424D] text-gray-400"
                  : isDataFresh()
                    ? "cursor-not-allowed bg-[#37424D] text-gray-400"
                    : "bg-[#5865F2] text-white hover:bg-[#4752C4]"
              }`}
            >
              {isRefreshing ? (
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
                  Refreshing...
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
          </div>

          {/* Progress Bar - Only show when progress is defined */}
          {scanWebSocket.progress !== undefined &&
            scanWebSocket.status === "scanning" && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{scanWebSocket.progress}%</span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-gray-700"
                  role="progressbar"
                  aria-valuenow={scanWebSocket.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Scanning progress: ${scanWebSocket.progress}%`}
                >
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all duration-300"
                    style={{ width: `${scanWebSocket.progress}%` }}
                  />
                </div>
              </div>
            )}

          {/* Error Message - but not for "user not found" since that gets a toast */}
          {scanWebSocket.error &&
            !scanWebSocket.error.includes("User not found in game") && (
              <div className="mt-2 text-sm text-red-400">
                Error: {scanWebSocket.error}
              </div>
            )}

          {/* Data Status */}
          <div className="rounded-lg bg-[#37424D] p-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-muted text-sm font-medium">Data Status</h4>
                <p className="text-sm text-white">
                  {isDataFresh() ? (
                    <span
                      className="text-green-400"
                      aria-label="Data is fresh and up to date"
                    >
                      Fresh data
                    </span>
                  ) : (
                    <span
                      className="text-yellow-400"
                      aria-label="Data may be outdated"
                    >
                      Data may be outdated
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted text-xs">
                  {isDataFresh() ? "Updated recently" : "Last updated"}
                </p>
                <p className="text-xs text-white">
                  {currentData?.updated_at
                    ? new Date(currentData.updated_at * 1000).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
            </div>
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

      {/* Refresh Success Message */}
      {refreshedData && (
        <div className="rounded-lg border border-green-500/20 bg-green-900/20 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm font-medium text-green-400">
              Data refreshed successfully!
            </span>
          </div>
          <p className="mt-1 text-xs text-green-300">
            Updated {refreshedData.item_count} items
          </p>
        </div>
      )}

      {/* Supporter Modal */}
      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature || "refresh inventory data"}
        currentTier={modalState.currentTier || 0}
        requiredTier={modalState.requiredTier || 1}
      />
    </>
  );
}
