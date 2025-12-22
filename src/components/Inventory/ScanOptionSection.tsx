"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { ENABLE_WS_SCAN } from "@/utils/api";

interface ScanOptionSectionProps {
  variant?: "main" | "embedded";
  isOwnInventory?: boolean;
}

export default function ScanOptionSection({
  variant = "main",
  isOwnInventory = false,
}: ScanOptionSectionProps) {
  const { user, isAuthenticated, setShowLoginModal } = useAuthContext();
  const backgroundClass =
    variant === "main" ? "bg-secondary-bg" : "bg-secondary-bg";
  const borderClass = "border-border-primary";

  return (
    <div
      className={`${backgroundClass} ${!isOwnInventory ? `mb-6 rounded-lg border ${borderClass} shadow-card-shadow p-4` : ""}`}
    >
      <div
        className={`flex items-start gap-3 ${isOwnInventory ? "justify-center" : ""}`}
      >
        {!isOwnInventory && (
          <div className="shrink-0">
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
        )}
        <div
          className={`${isOwnInventory ? "flex justify-center" : "min-w-0 flex-1"}`}
        >
          {!isOwnInventory && (
            <>
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
            </>
          )}
          <div
            className={`flex ${isOwnInventory ? "justify-center" : "gap-2"}`}
          >
            {!isAuthenticated ? (
              <Link
                href="/faq"
                className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Learn More
              </Link>
            ) : user?.roblox_id && !isOwnInventory ? (
              <div className="flex gap-2">
                <Link
                  href={`/inventories/${user.roblox_id}`}
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  View My Inventory
                </Link>
                <Link
                  href={`/og/${user.roblox_id}`}
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  View My OG items
                </Link>
              </div>
            ) : user?.roblox_id && isOwnInventory ? (
              !ENABLE_WS_SCAN ? (
                <button
                  disabled
                  className="border-button-info-disabled bg-button-info-disabled text-form-button-text inline-flex cursor-not-allowed items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
                >
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
                  Scanning Temporarily Disabled
                </button>
              ) : (
                <button
                  onClick={() => {
                    // This will be handled by the parent component with scan functionality
                    const event = new CustomEvent("requestScan");
                    window.dispatchEvent(event);
                  }}
                  className="bg-button-info text-form-button-text hover:bg-button-info-hover inline-flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
                >
                  Request a Scan
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  const event = new CustomEvent("setLoginTab", { detail: 1 });
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
  );
}
