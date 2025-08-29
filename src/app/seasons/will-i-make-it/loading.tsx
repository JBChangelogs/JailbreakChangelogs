import React from 'react';
import Breadcrumb from '@/components/Layout/Breadcrumb';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />
        
        <div className="mt-8">
          <div className="h-12 bg-[#37424D] rounded-lg mb-4 animate-pulse"></div>
          <div className="h-6 bg-[#37424D] rounded-lg mb-8 w-3/4 animate-pulse"></div>
        </div>

        {/* Season Info & Countdown Section Skeleton */}
        <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <div className="h-8 bg-[#37424D] rounded-lg mb-2 w-1/2 mx-auto animate-pulse"></div>
          <div className="h-5 bg-[#37424D] rounded-lg mb-1 w-3/4 mx-auto animate-pulse"></div>
          <div className="h-5 bg-[#37424D] rounded-lg mb-4 w-1/2 mx-auto animate-pulse"></div>

          <div className="space-y-4">
            <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
              <div className="h-6 bg-[#2E3944] rounded-lg mb-3 w-1/2 mx-auto animate-pulse"></div>
              <div className="h-10 bg-[#2E3944] rounded-lg w-3/4 mx-auto animate-pulse"></div>
            </div>

            <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
              <div className="h-6 bg-[#2E3944] rounded-lg mb-3 w-1/2 mx-auto animate-pulse"></div>
              <div className="h-10 bg-[#2E3944] rounded-lg w-3/4 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* XP Calculator Form Skeleton */}
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <div className="h-6 bg-[#37424D] rounded-lg mb-4 w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
          </div>

        </div>
      </div>
    </div>
  );
} 