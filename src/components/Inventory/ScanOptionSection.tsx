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
  const backgroundClass = variant === "main" ? "bg-[#212A31]" : "bg-[#2E3944]";
  const borderClass =
    variant === "main" ? "border-[#2E3944]" : "border-[#37424D]";

  return (
    <div
      className={`mb-6 rounded-lg border ${borderClass} ${backgroundClass} p-4`}
    >
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
                  const event = new CustomEvent("setLoginTab", { detail: 1 });
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
  );
}
