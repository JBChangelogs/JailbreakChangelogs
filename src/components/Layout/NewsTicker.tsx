"use client";

import { useState } from "react";
import { safeLocalStorage } from "@/utils/safeStorage";

export default function NewsTicker() {
  // Initialize state based on localStorage
  const [isVisible, setIsVisible] = useState(() => {
    const dismissed = safeLocalStorage.getItem(
      "inventory-release-announcement-dismissed",
    );
    return dismissed !== "true";
  });

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to remember user's choice
    safeLocalStorage.setItem(
      "inventory-release-announcement-dismissed",
      "true",
    );
  };

  if (!isVisible) return null;

  return (
    <div className="from-button-info/10 to-button-info/5 bg-gradient-to-r">
      <div className="container mx-auto px-4 py-3">
        <div className="relative flex flex-col items-center justify-center gap-3 pr-8 lg:flex-row lg:gap-4 lg:pr-12">
          <div className="flex items-center gap-2">
            <div className="bg-button-info flex h-5 w-5 items-center justify-center rounded-full lg:h-6 lg:w-6">
              <svg
                className="text-form-button-text h-3 w-3 lg:h-4 lg:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-button-info text-xs font-semibold lg:text-sm">
              NEW FEATURE
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-3">
            <span className="text-primary-text text-center text-xs lg:text-sm">
              <strong>Inventory Checker!</strong> Check your own inventory or
              browse other players&apos; inventories to see their items and
              values
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
