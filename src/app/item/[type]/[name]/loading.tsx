import { Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="rounded" width={120} height={24} />
        </div>

        {/* Header section skeleton */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row">
          {/* Image/Video skeleton */}
          <div className="shrink-0">
            <Skeleton
              variant="rounded"
              width={320}
              height={180}
              className="bg-secondary-bg"
            />
          </div>
          {/* Main info skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton
              variant="text"
              width={220}
              height={40}
              className="bg-secondary-bg"
            />
            <Skeleton
              variant="text"
              width={120}
              height={28}
              className="bg-secondary-bg"
            />
            <Skeleton
              variant="text"
              width={180}
              height={24}
              className="bg-secondary-bg"
            />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={60}
                  height={28}
                  className="bg-secondary-bg"
                />
              ))}
            </div>
            <Skeleton
              variant="text"
              width={160}
              height={20}
              className="bg-secondary-bg"
            />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mb-8">
          <div className="mb-4 flex gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                width={100}
                height={32}
                className="bg-secondary-bg"
              />
            ))}
          </div>
          {/* Tab content skeleton */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                width="100%"
                height={20}
                className="bg-secondary-bg"
              />
            ))}
          </div>
        </div>

        {/* Similar items skeleton */}
        <div className="mb-8">
          <Skeleton
            variant="text"
            width={180}
            height={28}
            className="bg-secondary-bg"
          />
          <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                width={150}
                height={90}
                className="bg-secondary-bg"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
