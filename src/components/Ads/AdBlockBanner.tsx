"use client";

import { Icon } from "@/components/ui/IconWrapper";
import Link from "next/link";

interface AdBlockBannerProps {
  onDismiss: () => void;
}

const AdBlockBanner = ({ onDismiss }: AdBlockBannerProps) => {
  return (
    <div className="bg-secondary-bg border-button-info fixed right-0 bottom-0 left-0 z-[2147483647] border-t shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Message */}
        <div className="flex flex-1 items-center gap-3">
          <div className="bg-button-info/10 rounded-lg p-2">
            <svg
              className="text-button-info h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-primary-text text-sm font-medium sm:text-base">
              We noticed you&#39;re using an ad blocker
            </p>
            <p className="text-secondary-text hidden text-xs sm:block sm:text-sm">
              Please whitelist us or become a supporter to help keep this site
              running
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/supporting"
            className="bg-button-info text-form-button-text hover:bg-button-info-hover cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2"
          >
            Support Us
          </Link>
          <button
            onClick={onDismiss}
            className="text-secondary-text hover:text-primary-text cursor-pointer rounded-lg p-1.5 transition-colors"
            aria-label="Dismiss"
          >
            <Icon icon="heroicons:x-mark" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdBlockBanner;
