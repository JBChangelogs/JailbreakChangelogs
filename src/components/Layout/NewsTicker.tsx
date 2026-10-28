"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NewsTickerAnnouncement } from "@/utils/api/runtimeFlags";
import { safeLocalStorage } from "@/utils/storage/safeStorage";

export default function NewsTicker({
  announcement,
}: {
  announcement: NewsTickerAnnouncement | null;
}) {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const storageKey = announcement
    ? `news-ticker-${announcement.id}-dismissed`
    : null;

  useEffect(() => {
    if (!storageKey) return;
    // Only run on client after mount - check localStorage
    const dismissed = safeLocalStorage.getItem(storageKey);
    // eslint-disable-next-line
    setIsVisible(dismissed !== "true");
  }, [storageKey]);

  if (!announcement || isVisible !== true) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to remember user's choice
    if (storageKey) safeLocalStorage.setItem(storageKey, "true");
  };

  return (
    <div className="from-status-info/15 to-secondary-bg bg-secondary-bg bg-linear-to-r">
      <div className="relative px-4 py-2">
        <div className="flex flex-col items-center justify-center gap-2 px-8 lg:flex-row lg:gap-3 lg:px-12">
          {announcement.label && (
            <div className="flex items-center gap-2">
              <span className="text-warning text-xs font-semibold">
                {announcement.label}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-primary-text text-center text-xs">
              <span>{announcement.message}</span>
              {announcement.linkText && announcement.linkUrl && (
                <span>
                  {" "}
                  <Link
                    href={announcement.linkUrl}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover font-semibold underline"
                  >
                    {announcement.linkText}
                  </Link>
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-primary-text hover:bg-tertiary-bg focus-visible:ring-border-focus absolute top-1/2 right-4 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Dismiss announcement"
          >
            <svg
              aria-hidden="true"
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
