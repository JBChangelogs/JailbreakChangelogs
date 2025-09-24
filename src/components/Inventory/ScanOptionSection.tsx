"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";

interface ScanOptionSectionProps {
  variant?: "main" | "embedded";
}

export default function ScanOptionSection({
  variant = "main",
}: ScanOptionSectionProps) {
  const { user, isAuthenticated } = useAuthContext();

  // Use different background colors based on context
  const backgroundClass =
    variant === "main" ? "bg-secondary-bg" : "bg-secondary-bg";
  const borderClass =
    variant === "main" ? "border-border-primary" : "border-border-primary";

  return (
    <div
      className={`mb-6 rounded-lg border ${borderClass} ${backgroundClass} shadow-card-shadow p-4`}
    >
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
