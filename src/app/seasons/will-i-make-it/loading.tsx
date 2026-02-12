import React from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb />

        <div className="mt-8">
          <div className="bg-button-secondary mb-4 h-12 animate-pulse rounded-lg"></div>
          <div className="bg-button-secondary mb-8 h-6 w-3/4 animate-pulse rounded-lg"></div>
        </div>

        {/* Season Info & Countdown Section Skeleton */}
        <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
          <div className="bg-button-secondary mx-auto mb-2 h-8 w-1/2 animate-pulse rounded-lg"></div>
          <div className="bg-button-secondary mx-auto mb-1 h-5 w-3/4 animate-pulse rounded-lg"></div>
          <div className="bg-button-secondary mx-auto mb-4 h-5 w-1/2 animate-pulse rounded-lg"></div>

          <div className="space-y-4">
            <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
              <div className="bg-button-secondary mx-auto mb-3 h-6 w-1/2 animate-pulse rounded-lg"></div>
              <div className="bg-button-secondary mx-auto h-10 w-3/4 animate-pulse rounded-lg"></div>
            </div>

            <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
              <div className="bg-button-secondary mx-auto mb-3 h-6 w-1/2 animate-pulse rounded-lg"></div>
              <div className="bg-button-secondary mx-auto h-10 w-3/4 animate-pulse rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* XP Calculator Form Skeleton */}
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
          <div className="bg-button-secondary mb-4 h-6 w-1/3 animate-pulse rounded-lg"></div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="bg-button-secondary h-12 animate-pulse rounded-lg"></div>
            <div className="bg-button-secondary h-12 animate-pulse rounded-lg"></div>
            <div className="bg-button-secondary h-12 animate-pulse rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
