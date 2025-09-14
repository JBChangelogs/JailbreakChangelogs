"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function NewsTicker() {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to remember user's choice
    localStorage.setItem("og-finder-announcement-dismissed", "true");
  };

  useEffect(() => {
    // Check if user has previously dismissed this announcement
    const dismissed = localStorage.getItem("og-finder-announcement-dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="border-b border-[#2E3944] bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5">
      <div className="container mx-auto px-4 py-3">
        <div className="relative flex flex-col items-center justify-center gap-3 pr-8 sm:flex-row sm:gap-4 sm:pr-12">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5865F2] sm:h-6 sm:w-6">
              <svg
                className="h-3 w-3 text-white sm:h-4 sm:w-4"
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
            <span className="text-xs font-semibold text-[#5865F2] sm:text-sm">
              NEW FEATURE
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <span className="text-center text-xs text-white sm:text-sm">
              Introducing our <strong>OG Finder</strong> - Track down your
              original items!
            </span>
            <Link
              href="/og"
              className="inline-flex items-center gap-1 rounded-md bg-[#5865F2] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[#4752C4] sm:px-3"
            >
              Try it now
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute right-2 cursor-pointer text-white transition-colors hover:text-white sm:right-0"
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
