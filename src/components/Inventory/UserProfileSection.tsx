"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DefaultAvatar } from "@/utils/avatar";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { useAuthContext } from "@/contexts/AuthContext";
import { useScanWebSocket } from "@/hooks/useScanWebSocket";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";

import ScanInventoryModal from "@/components/Modals/ScanInventoryModal";
import { ENABLE_WS_SCAN } from "@/utils/api";
import {
  showScanLoadingToast,
  updateScanLoadingToast,
  dismissScanLoadingToast,
  showScanSuccessToast,
  showScanErrorToast,
} from "@/utils/scanToasts";
import {
  formatScanProgressMessage,
  getScanActiveButtonLabel,
} from "@/utils/scanProgressMessage";
import { Button } from "../ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserProfileSectionProps {
  userId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
  currentData: InventoryData;
}

export default function UserProfileSection({
  userId,
  userConnectionData,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  getHasVerifiedBadge,
  currentData,
}: UserProfileSectionProps) {
  const { user, isAuthenticated, setLoginModal } = useAuthContext();
  const { modalState, openModal, closeModal } = useSupporterModal();
  const scanWebSocket = useScanWebSocket(currentData?.user_id || "");
  const scanCompletedRef = useRef(false);

  const [showScanModal, setShowScanModal] = useState(false);

  // Check if current user is viewing their own inventory
  const isOwnInventory =
    isAuthenticated && user?.roblox_id === currentData?.user_id;
  const shouldBypassTurnstile =
    Boolean(user?.flags?.some((f) => f.flag === "is_owner")) || false;

  const handleScanClick = () => {
    if (
      !ENABLE_WS_SCAN ||
      scanWebSocket.status === "scanning" ||
      scanWebSocket.status === "connecting"
    ) {
      return;
    }
    setShowScanModal(true);
  };

  const handleScanWithToken = (turnstileToken: string) => {
    scanWebSocket.startScan(turnstileToken);
    setShowScanModal(false);
  };

  const handleCloseScanModal = () => {
    if (
      scanWebSocket.status !== "scanning" &&
      scanWebSocket.status !== "connecting"
    ) {
      setShowScanModal(false);
    }
  };

  useEffect(() => {
    if (scanWebSocket.status === "connecting") {
      scanCompletedRef.current = false;
      showScanLoadingToast("Connecting to scan service...");
    }

    if (scanWebSocket.status === "scanning" && !scanCompletedRef.current) {
      updateScanLoadingToast(
        formatScanProgressMessage(
          scanWebSocket.phase,
          scanWebSocket.message,
          scanWebSocket.progress,
        ),
      );
    }

    if (
      scanWebSocket.status === "completed" &&
      scanWebSocket.phase === "queued" &&
      !scanCompletedRef.current
    ) {
      scanCompletedRef.current = true;
      showScanSuccessToast(
        formatScanProgressMessage(
          scanWebSocket.phase,
          scanWebSocket.message,
          scanWebSocket.progress,
        ),
      );
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
      } else if (scanWebSocket.phase === "failed_not_in_server") {
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
          feature: "inventory_scan",
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
    scanWebSocket.phase,
    scanWebSocket.status,
    scanWebSocket.error,
    scanWebSocket.progress,
    scanWebSocket.expiresAt,
    openModal,
    user?.premiumtype,
  ]);

  return (
    <div className="border-border-card bg-tertiary-bg mb-6 flex flex-col gap-4 rounded-lg border p-4 xl:flex-row xl:items-start xl:justify-between">
      {/* Avatar and User Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {getUserAvatar(userId) ? (
          <Image
            src={getUserAvatar(userId)!}
            alt="Roblox Avatar"
            width={64}
            height={64}
            className="bg-tertiary-bg shrink-0 rounded-full"
          />
        ) : (
          <div className="bg-tertiary-bg text-tertiary-bg flex h-16 w-16 shrink-0 items-center justify-center rounded-full">
            <DefaultAvatar />
          </div>
        )}

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-primary-text text-lg font-bold wrap-break-word">
            <span className="inline-flex items-center gap-2">
              {getUserDisplay(userId)}
              {getHasVerifiedBadge(userId) && (
                <VerifiedBadgeIcon className="h-4 w-4" />
              )}
            </span>
          </h3>
          <p className="text-primary-text text-sm wrap-break-word opacity-75">
            @{getUsername(userId)}
          </p>

          {/* Connection Icons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Discord Profile */}
            {userConnectionData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`https://discord.com/users/${userConnectionData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  >
                    <DiscordIcon className="text-border-focus h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm font-semibold">Discord</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Discord profile</TooltipContent>
              </Tooltip>
            )}

            {/* Roblox Profile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`https://www.roblox.com/users/${userId}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                >
                  <RobloxIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm font-semibold">Roblox</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Roblox profile</TooltipContent>
            </Tooltip>

            {/* Website Profile */}
            {userConnectionData && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/users/${userConnectionData.id}`}
                    prefetch={false}
                    className="bg-tertiary-bg/40 border-border-card text-primary-text inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                  >
                    <Image
                      src="https://assets.jailbreakchangelogs.xyz/assets/logos/JBCL_Short_Transparent.webp"
                      alt="JBCL Logo"
                      width={16}
                      height={16}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    <span className="text-sm font-semibold">Website</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>JBCL profile</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Scan Button or Login Prompt */}
      {isOwnInventory ? (
        <div className="mt-4 space-y-3 xl:mt-0 xl:shrink-0">
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 lg:flex-row lg:gap-3">
            <Button
              onClick={handleScanClick}
              disabled={
                !ENABLE_WS_SCAN ||
                scanWebSocket.status === "scanning" ||
                scanWebSocket.status === "connecting"
              }
              variant="default"
              size="md"
              className="gap-2"
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
                  {getScanActiveButtonLabel(
                    scanWebSocket.phase,
                    scanWebSocket.message,
                  )}
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
            </Button>
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
        <div className="mt-4 flex flex-col gap-3 xl:mt-0 xl:shrink-0">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <svg
                  className="text-link mt-0.5 h-5 w-5"
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
                    <Button asChild size="sm">
                      <Link href="/faq">Learn More</Link>
                    </Button>
                  ) : user?.roblox_id ? (
                    <Button asChild size="sm">
                      <Link href={`/inventories/${user.roblox_id}`}>
                        View My Inventory
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setLoginModal({ open: true, tab: "roblox" });
                      }}
                      size="sm"
                    >
                      Connect Roblox Account
                    </Button>
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
        feature={modalState.feature}
        currentTier={modalState.currentTier || 0}
        requiredTier={modalState.requiredTier || 1}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />

      {/* Scan Inventory Modal with Turnstile */}
      <ScanInventoryModal
        isOpen={showScanModal}
        onClose={handleCloseScanModal}
        onSuccess={handleScanWithToken}
        isScanning={
          scanWebSocket.status === "scanning" ||
          scanWebSocket.status === "connecting"
        }
        bypassTurnstile={shouldBypassTurnstile}
      />
    </div>
  );
}
