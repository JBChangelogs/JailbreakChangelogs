import React from "react";
import { DiscordIcon } from "@/components/Icons/DiscordIcon";

interface ExperimentalFeatureBannerProps {
  className?: string;
}

export default function ExperimentalFeatureBanner({
  className = "",
}: ExperimentalFeatureBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-amber-200/20 bg-gradient-to-br from-amber-50/5 via-amber-100/5 to-orange-50/5 backdrop-blur-sm ${className}`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 via-orange-400/5 to-red-400/5" />

      <div className="relative p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Modern icon */}
          <div className="flex flex-shrink-0 justify-center sm:justify-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/30 bg-gradient-to-br from-amber-400/20 to-orange-500/20">
              <svg
                className="h-5 w-5 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h3 className="text-base font-semibold text-amber-100">
                Experimental Feature
              </h3>
              <span className="mx-auto w-fit rounded border border-amber-400/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 uppercase sm:mx-0">
                Beta
              </span>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-gray-300">
              This feature is experimental; information may be inaccurate or the
              feature may break.
            </p>

            <a
              href="https://discord.jailbreakchangelogs.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition-all duration-200 hover:scale-[1.02] hover:border-amber-400/40 hover:from-amber-500/20 hover:to-orange-500/20 sm:w-auto"
            >
              <DiscordIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-center sm:text-left">
                Help us improve it by reporting any issues you find
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
