import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mt-8 mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
            <Skeleton
              style={{ width: "60%", height: 40 }}
              className="bg-secondary-bg"
            />
            <Skeleton
              style={{ width: "40%", height: 24 }}
              className="bg-secondary-bg mt-2"
            />
            <div className="mt-4">
              <Skeleton
                style={{ width: "20%", height: 20 }}
                className="bg-secondary-bg"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[45, 65, 50, 80, 55, 70, 60, 75].map((width, i) => (
                  <Skeleton
                    key={i}
                    style={{ width, height: 16 }}
                    className="bg-secondary-bg"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton
                className="bg-surface-bg rounded rounded-none"
                style={{ width: "100%", height: 56 }}
              />
              <Skeleton
                className="bg-surface-bg rounded rounded-none"
                style={{ width: 150, height: 56 }}
              />
            </div>
          </div>

          {/* Changes Grid Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-4"
              >
                <div className="mb-4 flex items-center gap-3">
                  <Skeleton
                    className="bg-secondary-bg rounded-lg rounded-none"
                    style={{ width: 64, height: 64 }}
                  />
                  <div className="flex-1">
                    <Skeleton
                      style={{ width: "80%", height: 24 }}
                      className="bg-secondary-bg"
                    />
                    <Skeleton
                      style={{ width: "60%", height: 20 }}
                      className="bg-secondary-bg mt-1"
                    />
                  </div>
                </div>
                <div className="mb-4 space-y-2">
                  <Skeleton
                    style={{ width: "70%", height: 20 }}
                    className="bg-secondary-bg"
                  />
                  <Skeleton
                    style={{ width: "90%", height: 20 }}
                    className="bg-secondary-bg"
                  />
                </div>
                <div className="border-border-card flex items-center justify-between border-t pt-4">
                  <Skeleton
                    className="bg-secondary-bg rounded-full"
                    style={{ width: 24, height: 24 }}
                  />
                  <Skeleton
                    style={{ width: "30%", height: 16 }}
                    className="bg-secondary-bg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
