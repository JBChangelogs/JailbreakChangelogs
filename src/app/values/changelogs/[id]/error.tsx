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
        <div className="text-primary-text py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="border-button-danger/30 bg-button-danger/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
              <svg
                className="text-button-danger h-8 w-8"
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
            <h2 className="text-primary-text mb-4 text-2xl font-bold">
              Something went wrong!
            </h2>
            <p className="text-secondary-text mb-6">
              {error.message === "Changelog not found"
                ? "The changelog you're looking for doesn't exist or has been removed."
                : "An unexpected error occurred while loading the changelog details."}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="bg-button-info hover:bg-button-info-hover text-form-button-text border-border-primary hover:border-border-focus rounded-lg border px-6 py-3 font-medium transition-colors"
              >
                Try again
              </button>
              <Link
                href="/values/changelogs"
                className="bg-secondary-bg hover:bg-quaternary-bg text-primary-text border-border-primary hover:border-border-focus rounded-lg border px-6 py-3 text-center font-medium transition-colors"
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
