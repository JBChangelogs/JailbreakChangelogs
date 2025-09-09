import React from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />

        <div className="mt-8">
          <div className="mb-4 h-12 animate-pulse rounded-lg bg-[#37424D]"></div>
          <div className="mb-8 h-6 w-3/4 animate-pulse rounded-lg bg-[#37424D]"></div>
        </div>

        {/* Season Info & Countdown Section Skeleton */}
        <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <div className="mx-auto mb-2 h-8 w-1/2 animate-pulse rounded-lg bg-[#37424D]"></div>
          <div className="mx-auto mb-1 h-5 w-3/4 animate-pulse rounded-lg bg-[#37424D]"></div>
          <div className="mx-auto mb-4 h-5 w-1/2 animate-pulse rounded-lg bg-[#37424D]"></div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
              <div className="mx-auto mb-3 h-6 w-1/2 animate-pulse rounded-lg bg-[#2E3944]"></div>
              <div className="mx-auto h-10 w-3/4 animate-pulse rounded-lg bg-[#2E3944]"></div>
            </div>

            <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
              <div className="mx-auto mb-3 h-6 w-1/2 animate-pulse rounded-lg bg-[#2E3944]"></div>
              <div className="mx-auto h-10 w-3/4 animate-pulse rounded-lg bg-[#2E3944]"></div>
            </div>
          </div>
        </div>

        {/* XP Calculator Form Skeleton */}
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <div className="mb-4 h-6 w-1/3 animate-pulse rounded-lg bg-[#37424D]"></div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-12 animate-pulse rounded-lg bg-[#37424D]"></div>
            <div className="h-12 animate-pulse rounded-lg bg-[#37424D]"></div>
            <div className="h-12 animate-pulse rounded-lg bg-[#37424D]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
