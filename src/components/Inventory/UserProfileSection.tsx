"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { useAuthContext } from "@/contexts/AuthContext";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";
import { ENABLE_WS_SCAN } from "@/utils/api/api";
import {
  showScanLoadingToast,
  updateScanLoadingToast,
  dismissScanLoadingToast,
  showScanSuccessToast,
  showScanErrorToast,
} from "@/utils/notifications/scanToasts";

const Tooltip = dynamic(() => import("@mui/material/Tooltip"), { ssr: false });

interface UserProfileSectionProps {
  userId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
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
  getHasVerifiedBadge,
  currentData,
  isRefreshing,
  onRefresh,
}: UserProfileSectionProps) {
  const { user, isAuthenticated, setShowLoginModal } = useAuthContext();
  const { modalState, openModal, closeModal } = useSupporterModal();
  const scanWebSocket = useScanWebSocket(currentData?.user_id || "");
  const scanCompletedRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(() =>
    Math.floor(Date.now() / 1000),
  );

  // Check if current user is viewing their own inventory
  const isOwnInventory =
    isAuthenticated && user?.roblox_id === currentData?.user_id;

  const isDataFresh = () => {
    if (!currentData) return false;
    const dataAge = currentTime - currentData.updated_at;
    return dataAge < 300; // 5 minutes
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    onRefresh();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scanWebSocket.status === "connecting") {
      scanCompletedRef.current = false;
      showScanLoadingToast("Connecting to scan service...");
    }

    if (scanWebSocket.status === "scanning" && !scanCompletedRef.current) {
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
      } else if (
        scanWebSocket.error &&
        scanWebSocket.error.includes("high enough supporter")
      ) {
        showScanErrorToast("You need to be Supporter III to use this feature.");
        const userTier = user?.premiumtype || 0;
        const TIER_NAMES = {
          0: "Free",
          1: "Supporter I",
          2: "Supporter II",
          3: "Supporter III",
        };
        const currentLimit =
          TIER_NAMES[userTier as keyof typeof TIER_NAMES] || "Unknown";
        openModal({
          feature: "inventory_refresh",
          currentTier: userTier,
          requiredTier: 3,
          currentLimit: currentLimit,
          requiredLimit: "Supporter III",
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

        showScanErrorToast(message);
      } else if (scanWebSocket.error) {
        showScanErrorToast(scanWebSocket.error);
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
    scanWebSocket.expiresAt,
    openModal,
    user?.premiumtype,
  ]);

  return (
    <div className="bg-primary-bg mb-6 flex flex-col gap-4 rounded-lg p-4 xl:flex-row xl:items-start xl:justify-between">
      {/* Avatar and User Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {getUserAvatar(userId) ? (
          <Image
            src={getUserAvatar(userId)!}
            alt="Roblox Avatar"
            width={64}
            height={64}
            className="flex-shrink-0 rounded-full bg-tertiary-bg"
          />
        ) : (
          <div className="bg-tertiary-bg flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-tertiary-bg">
            <DefaultAvatar />
          </div>
        )}

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-primary-text text-lg font-bold break-words">
            <span className="inline-flex items-center gap-2">
              {getUserDisplay(userId)}
              {getHasVerifiedBadge(userId) && (
                <VerifiedBadgeIcon className="h-4 w-4" />
              )}
            </span>
          </h3>
          <p className="text-primary-text text-sm break-words">
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
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",

                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <a
                  href={`https://discord.com/users/${userConnectionData.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-text border-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
                >
                  <DiscordIcon className="text-button-info h-3 w-3 flex-shrink-0" />
                  <span className="text-xs font-medium">Discord</span>
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
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    fontSize: "0.75rem",
                    padding: "8px 12px",
                    borderRadius: "8px",

                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <a
                href={`https://www.roblox.com/users/${userId}/profile`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-text border-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
              >
                <RobloxIcon className="text-button-info h-3 w-3 flex-shrink-0" />
                <span className="text-xs font-medium">Roblox</span>
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
                      backgroundColor: "var(--color-secondary-bg)",
                      color: "var(--color-primary-text)",
                      fontSize: "0.75rem",
                      padding: "8px 12px",
                      borderRadius: "8px",

                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      "& .MuiTooltip-arrow": {
                        color: "var(--color-secondary-bg)",
                      },
                    },
                  },
                }}
              >
                <Link
                  href={`/users/${userConnectionData.id}`}
                  prefetch={false}
                  className="text-primary-text border-primary-text hover:bg-quaternary-bg inline-flex items-center gap-1 rounded-full border bg-transparent px-2 py-0.5 text-xs transition-colors"
                >
                  <Image
                    src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                    alt="JBCL Logo"
                    width={16}
                    height={16}
                    className="h-3 w-3 flex-shrink-0"
                  />
                  <span className="text-xs font-medium">Website</span>
                </Link>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Scan Button or Login Prompt */}
      {isOwnInventory ? (
        <div className="mt-4 space-y-3 xl:mt-0 xl:flex-shrink-0">
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 lg:flex-row lg:gap-3">
            <button
              onClick={scanWebSocket.startScan}
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
                      !ENABLE_WS_SCAN ? "cursor-not-allowed" : "cursor-progress"
                    }`
                  : "bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer"
              }`}
            >
              {!ENABLE_WS_SCAN ? (
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Scanning Disabled
                </>
              ) : scanWebSocket.status === "connecting" ? (
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
                  ? "bg-button-info-disabled text-form-button-text border-button-info-disabled cursor-progress"
                  : isDataFresh()
                    ? "bg-button-secondary text-secondary-text border-button-secondary cursor-not-allowed"
                    : "bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer"
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
                <div className="text-secondary-text mb-1 flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{scanWebSocket.progress}%</span>
                </div>
                <div className="bg-surface-bg h-2 w-full rounded-full">
                  <div
                    className="bg-button-info h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanWebSocket.progress}%` }}
                  />
                </div>
              </div>
            )}
        </div>
      ) : (
        /* Show login prompt for potential profile owner */
        <div>
          <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="text-button-info mt-0.5 h-5 w-5"
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
                <h4 className="text-primary-text mb-1 text-sm font-medium">
                  Want on-demand scans?
                </h4>
                <p className="text-secondary-text mb-3 text-sm">
                  {!ENABLE_WS_SCAN
                    ? "Inventory scanning is temporarily disabled. Please check back later."
                    : !isAuthenticated
                      ? "Login and connect your Roblox account to request instant inventory scans anytime."
                      : user?.roblox_id
                        ? "You can request instant inventory scans anytime from your own inventory page."
                        : "Connect your Roblox account to request instant inventory scans anytime."}
                </p>
                <div className="flex gap-2">
                  {!ENABLE_WS_SCAN ? (
                    <span className="text-secondary-text inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium">
                      Scanning Temporarily Disabled
                    </span>
                  ) : !isAuthenticated ? (
                    <Link
                      href="/faq"
                      className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      Learn More
                    </Link>
                  ) : user?.roblox_id ? (
                    <Link
                      href={`/inventories/${user.roblox_id}`}
                      className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
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
                      className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
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
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </div>
  );
}
