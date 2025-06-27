import React from 'react';
import { Skeleton } from '@mui/material';

export const TradeAdDetailsSkeleton: React.FC = () => {
  return (
    <div className="bg-[#212A31] rounded-lg border border-[#2E3944]">
      {/* Header */}
      <div className="p-6 border-b border-[#2E3944]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: '#2E3944' }} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="rounded" width={80} height={24} sx={{ bgcolor: '#2E3944' }} />
              <Skeleton variant="text" width={200} height={20} sx={{ bgcolor: '#2E3944' }} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#2E3944' }} />
            <div className="flex-1 min-w-0">
              <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: '#2E3944' }} />
              <Skeleton variant="text" width={80} height={20} sx={{ bgcolor: '#2E3944' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Trade Items */}
      <div className="p-6">
        {/* Item Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Offering Items */}
          <div>
            <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: '#2E3944' }} className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#2E3944] rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton variant="rounded" width={128} height={128} sx={{ bgcolor: '#37424D' }} />
                    <div className="flex-1 min-w-0">
                      <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: '#37424D' }} />
                      <div className="mt-2 space-y-1">
                        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#37424D' }} />
                        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: '#37424D' }} />
                        <Skeleton variant="text" width="50%" height={20} sx={{ bgcolor: '#37424D' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requesting Items */}
          <div>
            <Skeleton variant="text" width={80} height={24} sx={{ bgcolor: '#2E3944' }} className="mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#2E3944] rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton variant="rounded" width={128} height={128} sx={{ bgcolor: '#37424D' }} />
                    <div className="flex-1 min-w-0">
                      <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: '#37424D' }} />
                      <div className="mt-2 space-y-1">
                        <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: '#37424D' }} />
                        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: '#37424D' }} />
                        <Skeleton variant="text" width="50%" height={20} sx={{ bgcolor: '#37424D' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#2E3944] mb-6">
          <div className="flex space-x-8">
            <Skeleton variant="text" width={60} height={40} sx={{ bgcolor: '#2E3944' }} />
            <Skeleton variant="text" width={60} height={40} sx={{ bgcolor: '#2E3944' }} />
            <Skeleton variant="text" width={80} height={40} sx={{ bgcolor: '#2E3944' }} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          <Skeleton variant="rounded" height={80} sx={{ bgcolor: '#2E3944' }} />
          <Skeleton variant="rounded" height={80} sx={{ bgcolor: '#2E3944' }} />
          <Skeleton variant="rounded" height={80} sx={{ bgcolor: '#2E3944' }} />
        </div>
      </div>
    </div>
  );
}; 