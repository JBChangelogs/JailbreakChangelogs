import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-[#2A3441] to-[#1E252B] rounded-lg p-6 border border-[#37424D]">
        <Skeleton variant="text" width="60%" height={40} className="bg-[#37424D]" />
        <Skeleton variant="text" width="40%" height={24} className="bg-[#37424D] mt-2" />
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
  );
} 