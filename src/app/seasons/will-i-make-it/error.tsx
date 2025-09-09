"use client";

import React from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />

        <div className="mt-8 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <div className="mb-4 text-6xl">⚠️</div>
              <h1 className="mb-4 text-3xl font-bold text-white">
                Something went wrong!
              </h1>
              <p className="mb-6 text-gray-300">
                We encountered an error while loading the season data. This
                might be a temporary issue.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="w-full rounded-lg bg-[#FFB636] px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#FFA500]"
              >
                Try again
              </button>

              <button
                onClick={() => (window.location.href = "/seasons")}
                className="w-full rounded-lg bg-[#37424D] px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#2E3944]"
              >
                Go to Seasons
              </button>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400">
                  Error details (development only)
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-[#1a1a1a] p-3 text-xs text-red-400">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
