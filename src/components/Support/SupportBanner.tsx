"use client";

import React from "react";
import { XMarkIcon, HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface SupportBannerProps {
  onDismiss: () => void;
}

const SupportBanner: React.FC<SupportBannerProps> = ({ onDismiss }) => {
  return (
    <div
      className="fixed right-0 bottom-0 left-0 z-[2001] border-t border-[#4752C4] bg-gradient-to-r from-[#5865F2] to-[#4752C4] p-4"
      style={{
        boxShadow: "0 -4px 6px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex-shrink-0">
            <HeartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-white">
              <span className="font-semibold">
                Support Jailbreak Changelogs
              </span>
              <span className="ml-2 text-sm text-white/90">
                Remove ads and unlock supporter features
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/supporting"
            className="rounded bg-white px-4 py-2 text-sm font-medium text-[#4752C4] transition-colors hover:bg-gray-100"
          >
            View Benefits
          </Link>
          <button
            onClick={onDismiss}
            className="p-2 text-white/80 transition-colors hover:text-white"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportBanner;
