import { Skeleton } from "@mui/material";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function UserProfileLoading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 max-w-7xl">
        <Breadcrumb loading={true} />
        <div className="border-border-card overflow-hidden rounded-lg border shadow-md">
          {/* Banner skeleton */}
          <Skeleton variant="rectangular" height={256} />

          {/* Profile Content skeleton */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-6">
              {/* Avatar skeleton - matches UserAvatar component structure */}
              <div className="relative -mt-16 md:-mt-24">
                <div className="relative">
                  <Skeleton variant="circular" width={96} height={96} />
                  {/* Badge skeleton to account for dynamic badge loading - positioned like MUI Badge */}
                  <div className="absolute right-0 bottom-0 h-4 w-4 translate-x-1 translate-y-1 transform rounded-full border-2" />
                </div>
              </div>

              <div className="w-full flex-1 text-center md:text-left">
                <div className="flex flex-col items-center justify-between md:flex-row md:items-start">
                  <div>
                    {/* Username skeleton */}
                    <Skeleton variant="text" width={160} height={28} />
                    {/* Handle skeleton */}
                    <Skeleton variant="text" width={128} height={16} />
                    {/* Last seen skeleton */}
                    <Skeleton variant="text" width={192} height={12} />
                    {/* Member since skeleton */}
                    <Skeleton variant="text" width={224} height={12} />

                    {/* Follower/Following skeleton */}
                    <div className="mt-2 flex items-center justify-center space-x-4 md:justify-start">
                      <Skeleton variant="text" width={80} height={16} />
                      <Skeleton variant="text" width={80} height={16} />
                    </div>

                    {/* Connection icons skeleton */}
                    <div className="mt-2 flex items-center justify-center space-x-3 md:justify-start">
                      <Skeleton variant="circular" width={20} height={20} />
                      <Skeleton variant="circular" width={20} height={20} />
                    </div>
                  </div>

                  {/* Button skeleton */}
                  <Skeleton variant="rounded" width={112} height={40} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="mt-2 md:mt-6">
            <div className="border-b">
              <div className="flex gap-4 overflow-x-auto p-2">
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
              </div>
            </div>
            <div className="p-3 sm:p-4">
              {/* Tab content skeleton */}
              <div className="space-y-4">
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" height={80} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
