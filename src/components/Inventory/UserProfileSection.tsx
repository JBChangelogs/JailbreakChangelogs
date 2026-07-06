"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { InventoryData, UserConnectionData } from "@/app/inventories/types";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { DefaultAvatar } from "@/utils/ui/avatar";
import { VerifiedBadgeIcon } from "@/components/Icons/VerifiedBadgeIcon";
import { useAuthContext } from "@/contexts/AuthContext";
import { UseScanWebSocketReturn } from "@/hooks/useScanWebSocket";
import ScanInventoryModal from "@/components/Modals/ScanInventoryModal";
import { ENABLE_WS_SCAN } from "@/utils/api/api";
import { getScanActiveButtonLabel } from "@/utils/notifications/scanProgressMessage";
import { Button } from "../ui/button";
import { Icon } from "@/components/ui/IconWrapper";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "../ui/Spinner";

interface UserProfileSectionProps {
  userId: string;
  userConnectionData: UserConnectionData | null;
  getUserDisplay: (userId: string) => string;
  getUsername: (userId: string) => string;
  getUserAvatar: (userId: string) => string;
  getHasVerifiedBadge: (userId: string) => boolean;
  currentData: InventoryData;
  scanWebSocket: UseScanWebSocketReturn;
  scanErrorBanner?: { title: string; subtitle?: string } | null;
  queuePosition?: { position: number; delay: number } | null;
  isLoadingQueuePosition?: boolean;
  queueStatusMessage?: string;
  fetchQueuePosition?: () => void;
}

export default function UserProfileSection({
  userId,
  userConnectionData,
  getUserDisplay,
  getUsername,
  getUserAvatar,
  getHasVerifiedBadge,
  currentData,
  scanWebSocket,
  scanErrorBanner,
  queuePosition,
  isLoadingQueuePosition,
  queueStatusMessage,
  fetchQueuePosition,
}: UserProfileSectionProps) {
  const { user, isAuthenticated, setLoginModal } = useAuthContext();

  const [showScanModal, setShowScanModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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

  return (
    <div className="border-border-card bg-tertiary-bg mb-6 flex flex-col gap-4 rounded-lg border p-4 xl:flex-row xl:items-start xl:justify-between">
      {/* Avatar and User Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="bg-quaternary-bg relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
          {!avatarError ? (
            <Image
              src={getUserAvatar(userId)}
              alt="Roblox Avatar"
              fill
              className="object-cover"
              unoptimized
              onError={() => setAvatarError(true)}
            />
          ) : (
            <DefaultAvatar />
          )}
        </div>

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
                    prefetch={false}
                    className="text-primary-text bg-quaternary-bg border-border-card hover:bg-quaternary-bg/80 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
                  >
                    <DiscordIcon className="h-3.5 w-3.5 shrink-0" />
                    Discord
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
                  prefetch={false}
                  className="text-primary-text bg-quaternary-bg border-border-card hover:bg-quaternary-bg/80 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
                >
                  <RobloxIcon className="h-3.5 w-3.5 shrink-0" />
                  Roblox
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
                    className="text-primary-text bg-quaternary-bg border-border-card hover:bg-quaternary-bg/80 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-all"
                  >
                    <Image
                      src="https://assets.jailbreakchangelogs.com/assets/logos/JBCL_Short_Transparent.webp"
                      alt="JBCL Logo"
                      width={16}
                      height={16}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    Website
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
              variant={
                scanWebSocket.status === "completed" ? "success" : "default"
              }
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
                  <Spinner className="h-4 w-4" />
                  Connecting...
                </>
              ) : scanWebSocket.status === "scanning" ? (
                <>
                  <Spinner className="h-4 w-4" />
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
                <div className="bg-quaternary-bg h-2 w-full rounded-full">
                  <div
                    className="bg-button-info h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanWebSocket.progress}%` }}
                  />
                </div>
              </div>
            )}

          {/* Persistent scan outcome — stays visible even if the toast is missed */}
          {(scanWebSocket.status === "completed" ||
            scanWebSocket.status === "error") &&
            (scanErrorBanner ? (
              <div className="mt-2 flex w-full items-start justify-center gap-1.5 text-center">
                <Icon
                  icon="heroicons:exclamation-triangle"
                  className="text-button-danger mt-0.5 h-3.5 w-3.5 shrink-0"
                />
                <p className="text-button-danger min-w-0 flex-1 text-xs wrap-break-word">
                  <span className="font-medium">{scanErrorBanner.title}</span>
                  {scanErrorBanner.subtitle && (
                    <> — {scanErrorBanner.subtitle}</>
                  )}
                </p>
              </div>
            ) : (
              <div className="mt-2 flex w-full items-center justify-center gap-2">
                <p className="text-secondary-text min-w-0 flex-1 text-xs wrap-break-word">
                  {isLoadingQueuePosition ? (
                    "Checking queue position..."
                  ) : queuePosition ? (
                    <span className="text-primary-text font-medium">
                      Queue Position: #{queuePosition.position.toLocaleString()}
                    </span>
                  ) : scanWebSocket.queuePosition !== undefined ? (
                    <span className="text-primary-text font-medium">
                      Queue Position: #
                      {scanWebSocket.queuePosition.toLocaleString()}
                    </span>
                  ) : (
                    queueStatusMessage || "Not in queue"
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => fetchQueuePosition?.()}
                  disabled={isLoadingQueuePosition}
                  aria-label="Refresh queue position"
                  className="text-secondary-text hover:text-primary-text cursor-pointer rounded p-0.5 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {isLoadingQueuePosition ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Icon icon="material-symbols:refresh" className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
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
