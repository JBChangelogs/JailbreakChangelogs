import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#2E3944] mb-8">
      <div className="container mx-auto px-4">
        <div className="space-y-6">
      {/* Header Skeleton with Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Changelog Info Skeleton - Takes up 2/3 of the space */}
        <div className="lg:col-span-2 bg-gradient-to-r from-[#2A3441] to-[#1E252B] rounded-lg p-6 border border-[#37424D]">
          <Skeleton variant="text" width="60%" height={40} className="bg-[#37424D]" />
          <Skeleton variant="text" width="40%" height={24} className="bg-[#37424D] mt-2" />
          <div className="mt-4">
            <Skeleton variant="text" width="20%" height={20} className="bg-[#37424D]" />
            <div className="flex flex-wrap gap-2 mt-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} variant="text" width={Math.random() * 60 + 40} height={16} className="bg-[#37424D]" />
              ))}
            </div>
          </div>
        </div>

        {/* Ad Skeleton - Takes up 1/3 of the space */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a2127] rounded-lg border border-[#2E3944] h-full" style={{ minHeight: '250px' }}>
            <div className="p-4">
              <Skeleton variant="rectangular" width="100%" height="100%" className="bg-[#37424D] rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Skeleton */}
      <div className="bg-[#212A31] rounded-lg p-4 border border-[#37424D]">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton variant="rectangular" width="100%" height={56} className="bg-[#37424D] rounded" />
          <Skeleton variant="rectangular" width={150} height={56} className="bg-[#37424D] rounded" />
        </div>
      </div>

      {/* Changes Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#212A31] rounded-lg p-4 border border-[#37424D]">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton variant="rectangular" width={64} height={64} className="bg-[#37424D] rounded-lg" />
              <div className="flex-1">
                <Skeleton variant="text" width="80%" height={24} className="bg-[#37424D]" />
                <Skeleton variant="text" width="60%" height={20} className="bg-[#37424D] mt-1" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <Skeleton variant="text" width="70%" height={20} className="bg-[#37424D]" />
              <Skeleton variant="text" width="90%" height={20} className="bg-[#37424D]" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#37424D]">
              <Skeleton variant="circular" width={24} height={24} className="bg-[#37424D]" />
              <Skeleton variant="text" width="30%" height={16} className="bg-[#37424D]" />
            </div>
          </div>
        ))}
      </div>
        </div>
      </div>
    </main>
  );
} 