import Breadcrumb from "@/components/Layout/Breadcrumb";
import MostDuplicatedItemsSkeleton from "@/components/Dupes/MostDuplicatedItemsSkeleton";

export default function DupeFinderLoading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      {/* Banner Skeleton */}
      <div className="bg-button-secondary/20 mb-6 h-12 w-full animate-pulse rounded-lg"></div>

      {/* Title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-button-secondary h-9 w-48 animate-pulse rounded"></div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="bg-button-secondary h-4 w-full max-w-lg animate-pulse rounded"></div>
      </div>

      <div className="space-y-6">
        {/* Search Input Skeleton */}
        <div className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="bg-button-secondary h-12 flex-1 animate-pulse rounded-lg"></div>
            <div className="bg-button-secondary h-12 w-full animate-pulse rounded-lg sm:w-32"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton (Matches StatsPolling) */}
        <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-4"
            >
              <div className="bg-button-secondary mb-2 h-8 w-24 animate-pulse rounded"></div>
              <div className="bg-button-secondary h-4 w-32 animate-pulse rounded"></div>
            </div>
          ))}
        </div>

        <MostDuplicatedItemsSkeleton />
      </div>
    </div>
  );
}
