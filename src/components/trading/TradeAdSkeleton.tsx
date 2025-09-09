import React from "react";
import { Skeleton } from "@mui/material";

export const TradeAdSkeleton: React.FC = () => (
  <div className="mt-8">
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4"
        >
          {/* User Info Skeleton */}
          <div className="mb-4 flex items-center space-x-3">
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ bgcolor: "#2E3944" }}
            />
            <div className="flex-1">
              <Skeleton
                variant="text"
                width="75%"
                height={24}
                sx={{ bgcolor: "#2E3944" }}
              />
              <Skeleton
                variant="text"
                width="50%"
                height={20}
                sx={{ bgcolor: "#2E3944" }}
              />
            </div>
          </div>

          {/* Status Skeleton */}
          <div className="mb-4 flex justify-end">
            <Skeleton
              variant="rounded"
              width={80}
              height={24}
              sx={{ bgcolor: "#2E3944" }}
            />
          </div>

          {/* Trade Items Skeleton */}
          <div className="space-y-4">
            {/* Offering Section */}
            <div>
              <Skeleton
                variant="text"
                width="30%"
                height={20}
                sx={{ bgcolor: "#2E3944" }}
                className="mb-2"
              />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => (
                  <Skeleton
                    key={j}
                    variant="rounded"
                    width="100%"
                    height={80}
                    sx={{ bgcolor: "#2E3944" }}
                  />
                ))}
              </div>
            </div>

            {/* Requesting Section */}
            <div>
              <Skeleton
                variant="text"
                width="30%"
                height={20}
                sx={{ bgcolor: "#2E3944" }}
                className="mb-2"
              />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => (
                  <Skeleton
                    key={j}
                    variant="rounded"
                    width="100%"
                    height={80}
                    sx={{ bgcolor: "#2E3944" }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Date Skeleton */}
          <div className="mt-4">
            <Skeleton
              variant="text"
              width="40%"
              height={16}
              sx={{ bgcolor: "#2E3944" }}
            />
          </div>

          {/* Buttons Skeleton */}
          <div className="mt-4 space-y-2 border-t border-[#2E3944] pt-4">
            <Skeleton
              variant="rounded"
              width="100%"
              height={40}
              sx={{ bgcolor: "#2E3944" }}
            />
            <Skeleton
              variant="rounded"
              width="100%"
              height={40}
              sx={{ bgcolor: "#2E3944" }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);
