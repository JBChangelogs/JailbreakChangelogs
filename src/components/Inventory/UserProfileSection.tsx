"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { useAuthContext } from "@/contexts/AuthContext";
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

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface UserProfileSectionProps {
  userId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  currentData: InventoryData;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function UserProfileSection({
  userId,
  userConnectionData,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  currentData,
  isRefreshing,
  onRefresh,
}: UserProfileSectionProps) {
  const { user, isAuthenticated, setShowLoginModal } = useAuthContext();
  const { modalState, openModal, closeModal } = useSupporterModal();
  const scanWebSocket = useScanWebSocket(currentData?.user_id || "");
  const scanCompletedRef = useRef(false);

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

  useEffect(() => {
    if (scanWebSocket.status === "connecting") {
      scanCompletedRef.current = false;
      showScanLoadingToast("Connecting to scan service...");
    }

    if (scanWebSocket.status === "scanning" && !scanCompletedRef.current) {
      if (
        scanWebSocket.message &&
        scanWebSocket.message.includes("User found in game")
      ) {
        updateScanLoadingToast("User found in game - scan in progress!");
      } else if (
        scanWebSocket.message &&
        scanWebSocket.message.includes("Bot joined server")
      ) {
        updateScanLoadingToast("Bot joined server, scanning...");
      } else if (scanWebSocket.progress !== undefined) {
        updateScanLoadingToast(`Scanning... ${scanWebSocket.progress}%`);
      } else if (scanWebSocket.message) {
        updateScanLoadingToast(`Scanning: ${scanWebSocket.message}`);
      }
    }

    if (
      scanWebSocket.status === "completed" &&
      scanWebSocket.message &&
      scanWebSocket.message.includes("Added to queue") &&
      !scanCompletedRef.current
    ) {
      scanCompletedRef.current = true;
      showScanSuccessToast(scanWebSocket.message);
    }

    if (scanWebSocket.status === "error") {
      scanCompletedRef.current = true;
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
      } else if (scanWebSocket.error) {
        showScanErrorToast(`Scan error: ${scanWebSocket.error}`);
      }
    }

    if (scanWebSocket.status === "idle") {
      dismissScanLoadingToast();
      scanCompletedRef.current = false;
    }
  }, [
    scanWebSocket.message,
    scanWebSocket.status,
    scanWebSocket.error,
    scanWebSocket.progress,
  ]);

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center">
      {/* Avatar */}
      {getUserAvatar(userId) ? (
        <Image
          src={getUserAvatar(userId)!}
          alt="Roblox Avatar"
          width={64}
          height={64}
          className="flex-shrink-0 rounded-full bg-[#2E3944]"
        />
      ) : (
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[#2E3944]">
          <svg
            className="text-muted h-8 w-8"
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
        </div>
      )}

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <h3 className="text-muted text-lg font-bold break-words">
          {getUserDisplay(userId)}
        </h3>
        <p className="text-muted text-sm break-words opacity-75">
          @{getUsername(userId)}
        </p>

        {/* Connection Icons */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Discord Profile */}
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
                className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
              >
                <DiscordIcon className="h-4 w-4 flex-shrink-0 text-[#5865F2]" />
                <span className="text-sm font-medium">Discord</span>
              </a>
            </Tooltip>
          )}

          {/* Roblox Profile */}
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
              href={`https://www.roblox.com/users/${userId}/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
            >
              <RobloxIcon className="h-4 w-4 flex-shrink-0 text-[#00A2FF]" />
              <span className="text-sm font-medium">Roblox</span>
            </a>
          </Tooltip>

          {/* Website Profile */}
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
                className="text-muted flex items-center gap-2 rounded-full bg-gray-600 px-3 py-1.5"
              >
                <Image
                  src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                  alt="JBCL Logo"
                  width={16}
                  height={16}
                  className="h-4 w-4 flex-shrink-0"
                />
                <span className="text-sm font-medium">Website Profile</span>
              </Link>
            </Tooltip>
          )}
        </div>
      </div>

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
              ) : isDataFresh() ? (
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
                  Recently Updated
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
                <div className="h-2 w-full rounded-full bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all duration-300"
                    style={{ width: `${scanWebSocket.progress}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      ) : (
        /* Show login prompt for potential profile owner */
        <div className="mt-4">
          <div className="rounded-lg border border-[#37424D] bg-[#2E3944] p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="mt-0.5 h-5 w-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 text-sm font-medium text-white">
                  Want on-demand scans?
                </h4>
                <p className="mb-3 text-sm text-gray-400">
                  {!isAuthenticated
                    ? "Login and connect your Roblox account to request instant inventory scans anytime."
                    : user?.roblox_id
                      ? "You can request instant inventory scans anytime from your own inventory page."
                      : "Connect your Roblox account to request instant inventory scans anytime."}
                </p>
                <div className="flex gap-2">
                  {!isAuthenticated ? (
                    <Link
                      href="/faq"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752C4]"
                    >
                      Learn More
                    </Link>
                  ) : user?.roblox_id ? (
                    <Link
                      href={`/inventories/${user.roblox_id}`}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752C4]"
                    >
                      View My Inventory
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLoginModal(true);
                        const event = new CustomEvent("setLoginTab", {
                          detail: 1,
                        });
                        window.dispatchEvent(event);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#FF5630] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#E54B2C]"
                    >
                      Connect Roblox Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}
