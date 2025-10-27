"use client";

import React from "react";
import Link from "next/link";
import { useConsent } from "@/contexts/ConsentContext";

export default function CookieConsentBanner() {
  const { showBanner, acceptConsent, rejectConsent } = useConsent();

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-secondary-bg border-t border-border-primary shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-primary-text text-sm font-medium">
              We use cookies and similar technologies to enhance your experience
              on our website.
            </p>
            <p className="text-secondary-text mt-1 text-xs">
              This includes cookies from Microsoft Clarity for analytics and
              Google services. Learn more in our{" "}
              <Link
                href="/privacy"
                className="text-button-info hover:text-button-info-hover underline transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-shrink-0 gap-2 sm:gap-3">
            <button
              onClick={rejectConsent}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-primary-text bg-tertiary-bg hover:bg-quaternary-bg border border-border-primary rounded-lg transition-colors"
              aria-label="Reject cookies"
            >
              Reject
            </button>
            <button
              onClick={acceptConsent}
              className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-button-info hover:bg-button-info-hover rounded-lg transition-colors"
              aria-label="Accept cookies"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
