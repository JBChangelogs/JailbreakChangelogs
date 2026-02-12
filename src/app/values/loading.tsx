import { Skeleton } from "@mui/material";
import ItemCardSkeleton from "@/components/Items/ItemCardSkeleton";

export default function Loading() {
  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Header skeleton */}
        <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton
              variant="text"
              width={300}
              height={36}
              className="bg-secondary-bg"
            />
          </div>
          <Skeleton
            variant="text"
            width="100%"
            height={20}
            className="bg-secondary-bg"
          />
          <Skeleton
            variant="text"
            width="80%"
            height={20}
            className="bg-secondary-bg"
          />
        </div>

        {/* Category icons skeleton */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-2"
              >
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={40}
                  className="bg-secondary-bg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Trader notes skeleton */}
        <div className="mb-8">
          <Skeleton
            variant="text"
            width={200}
            height={28}
            className="bg-secondary-bg"
          />
          <div className="mb-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                variant="text"
                width="100%"
                height={16}
                className="bg-secondary-bg"
              />
            ))}
          </div>
          <Skeleton
            variant="text"
            width={250}
            height={28}
            className="bg-secondary-bg"
          />
          <div className="mb-4 flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-lg border p-1"
              >
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={32}
                  className="bg-secondary-bg"
                />
              </div>
            ))}
          </div>
          <Skeleton
            variant="text"
            width="100%"
            height={16}
            className="bg-secondary-bg"
          />
        </div>

        {/* Search and filter skeleton */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            {/* Search and dropdowns row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:gap-4">
              {/* Search input skeleton */}
              <div className="w-full lg:w-1/3">
                <div className="border-border-card bg-secondary-bg rounded-lg border p-2">
                  <Skeleton
                    variant="rounded"
                    width="100%"
                    height={40}
                    className="bg-secondary-bg"
                  />
                </div>
              </div>

              {/* Filter and Sort dropdowns skeleton */}
              <div className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:gap-4">
                {/* Filter dropdown skeleton */}
                <div className="w-full lg:w-1/2">
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-2">
                    <Skeleton
                      variant="rounded"
                      width="100%"
                      height={40}
                      className="bg-secondary-bg"
                    />
                  </div>
                </div>

                {/* Sort dropdown skeleton */}
                <div className="w-full lg:w-1/2">
                  <div className="border-border-card bg-secondary-bg rounded-lg border p-2">
                    <Skeleton
                      variant="rounded"
                      width="100%"
                      height={40}
                      className="bg-secondary-bg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Value range slider skeleton */}
            <div className="w-full">
              <div className="border-border-card bg-secondary-bg rounded-lg border p-3">
                <Skeleton
                  variant="rounded"
                  width="100%"
                  height={60}
                  className="bg-secondary-bg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results count skeleton */}
        <div className="mb-4">
          <Skeleton
            variant="text"
            width={200}
            height={20}
            className="bg-secondary-bg"
          />
        </div>

        {/* Items grid skeleton */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(24)].map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Pagination skeleton */}
        <div className="mt-8 flex justify-center">
          <div className="border-border-card bg-secondary-bg rounded-lg border p-2">
            <Skeleton
              variant="rounded"
              width={300}
              height={40}
              className="bg-secondary-bg"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
