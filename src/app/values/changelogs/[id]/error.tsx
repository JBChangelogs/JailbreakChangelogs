"use client";

import { useEffect } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Changelog details error:", error);
  }, [error]);

  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />
        <div className="py-16 text-center text-white">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/20">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
            <p className="mb-6 text-[#D3D9D4]">
              {error.message === "Changelog not found"
                ? "The changelog you're looking for doesn't exist or has been removed."
                : "An unexpected error occurred while loading the changelog details."}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="rounded-lg bg-[#5865F2] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4752C4]"
              >
                Try again
              </button>
              <Link
                href="/values/changelogs"
                className="rounded-lg bg-[#37424D] px-6 py-3 text-center font-medium text-white transition-colors hover:bg-[#2A3441]"
              >
                View all changelogs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
