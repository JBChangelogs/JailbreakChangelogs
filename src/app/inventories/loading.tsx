import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function InventoryCheckerLoading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      {/* Banner Skeleton */}
      <div className="bg-button-secondary/20 mb-6 h-12 w-full animate-pulse rounded-lg"></div>

      {/* Title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-button-secondary h-9 w-64 animate-pulse rounded"></div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="bg-button-secondary h-4 w-full max-w-lg animate-pulse rounded"></div>
      </div>

      {/* Scan Options Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="border-border-card bg-secondary-bg h-32 rounded-xl border p-6 shadow-sm">
          <div className="bg-button-secondary mb-4 h-6 w-32 animate-pulse rounded"></div>
          <div className="bg-button-secondary h-10 w-full animate-pulse rounded"></div>
        </div>
        <div className="border-border-card bg-secondary-bg hidden h-32 rounded-xl border p-6 shadow-sm md:block">
          <div className="bg-button-secondary mb-4 h-6 w-32 animate-pulse rounded"></div>
          <div className="bg-button-secondary h-10 w-full animate-pulse rounded"></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Interface Skeleton */}
        <div className="space-y-6">
          {/* Search Form */}
          <div className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="bg-button-secondary h-12 flex-1 animate-pulse rounded-lg"></div>
              <div className="bg-button-secondary h-12 w-full animate-pulse rounded-lg sm:w-32"></div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
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

        {/* Leaderboard Skeleton */}
        <div className="mt-8">
          <div className="bg-button-secondary mb-4 h-6 w-64 animate-pulse rounded"></div>
          <div className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-border-card bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-button-secondary h-8 w-8 animate-pulse rounded-full"></div>
                    <div className="bg-button-secondary h-10 w-10 animate-pulse rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-button-secondary mb-1 h-4 w-32 animate-pulse rounded"></div>
                    <div className="bg-button-secondary h-3 w-24 animate-pulse rounded"></div>
                  </div>
                  <div className="bg-button-secondary h-6 w-16 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
