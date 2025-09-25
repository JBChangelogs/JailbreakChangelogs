import React from "react";
import { Skeleton } from "@mui/material";

export const TradeAdDetailsSkeleton: React.FC = () => {
  return (
    <div className="border-border-primary bg-secondary-bg rounded-lg border">
      {/* Header */}
      <div className="border-border-primary border-b p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Skeleton variant="text" width={120} height={32} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="rounded" width={80} height={24} />
              <Skeleton variant="text" width={200} height={20} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="min-w-0 flex-1">
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="text" width={80} height={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Trade Items */}
      <div className="p-6">
        {/* Item Images */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Offering Items */}
          <div>
            <Skeleton
              variant="text"
              width={80}
              height={24}
              className="bg-secondary-bg mb-4"
            />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton variant="rounded" width={128} height={128} />
                    <div className="min-w-0 flex-1">
                      <Skeleton variant="text" width="80%" height={24} />
                      <div className="mt-2 space-y-1">
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={20} />
                        <Skeleton variant="text" width="50%" height={20} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requesting Items */}
          <div>
            <Skeleton
              variant="text"
              width={80}
              height={24}
              className="bg-secondary-bg mb-4"
            />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton variant="rounded" width={128} height={128} />
                    <div className="min-w-0 flex-1">
                      <Skeleton variant="text" width="80%" height={24} />
                      <div className="mt-2 space-y-1">
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={20} />
                        <Skeleton variant="text" width="50%" height={20} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-6 rounded-lg border">
          <div className="px-6 py-4">
            <div className="flex space-x-8">
              <Skeleton variant="text" width={60} height={40} />
              <Skeleton variant="text" width={60} height={40} />
              <Skeleton variant="text" width={80} height={40} />
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          <Skeleton variant="rounded" height={80} />
          <Skeleton variant="rounded" height={80} />
          <Skeleton variant="rounded" height={80} />
        </div>
      </div>
    </div>
  );
};
