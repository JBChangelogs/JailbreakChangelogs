"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { safeLocalStorage } from "@/utils/safeStorage";

export default function NewsTicker() {
  const shouldShowTicker = isFeatureEnabled("NEWS_TICKER");
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Only run on client after mount - check localStorage
    const dismissed = safeLocalStorage.getItem(
      "accounts-20k-giveaway-announcement-dismissed",
    );
    // eslint-disable-next-line
    setIsVisible(dismissed !== "true");
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to remember user's choice
    safeLocalStorage.setItem(
      "accounts-20k-giveaway-announcement-dismissed",
      "true",
    );
  };

  if (!shouldShowTicker || isVisible !== true) return null;

  return (
    <div className="from-status-info/15 to-secondary-bg bg-linear-to-r backdrop-blur-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="relative flex flex-col items-center justify-center gap-2 pr-8 lg:flex-row lg:gap-3 lg:pr-12">
          <div className="flex items-center gap-2">
            <span className="text-warning text-xs font-semibold">
              🎉 20K milestone
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-primary-text text-center text-xs">
              We’ve reached 20,000 sign-ups! Celebrate with our{" "}
              <Link
                href="https://discord.com/channels/1286064050135896064/1361921979036471476/1472344833266946049"
                prefetch={false}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover font-semibold underline"
              >
                20,000 Robux Discord giveaway
              </Link>
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="text-primary-text hover:text-primary-text absolute right-2 cursor-pointer transition-colors lg:right-0"
            aria-label="Dismiss announcement"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
