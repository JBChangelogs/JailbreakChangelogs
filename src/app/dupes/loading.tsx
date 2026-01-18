import Breadcrumb from "@/components/Layout/Breadcrumb";

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
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
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
              className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4"
            >
              <div className="bg-button-secondary mb-2 h-8 w-24 animate-pulse rounded"></div>
              <div className="bg-button-secondary h-4 w-32 animate-pulse rounded"></div>
            </div>
          ))}
        </div>

        {/* Top 10 List Skeleton (Matches MostDuplicatedItems) */}
        <div className="mt-6">
          <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
            <div className="bg-button-secondary mb-4 h-7 w-64 animate-pulse rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-border-primary bg-tertiary-bg h-14 w-full animate-pulse rounded-lg border"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
