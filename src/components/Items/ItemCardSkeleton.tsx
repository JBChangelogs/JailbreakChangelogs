import { Skeleton } from "@/components/ui/skeleton";

export default function ItemCardSkeleton() {
  return (
    <div className="w-full">
      <div className="border-border-card bg-secondary-bg relative flex flex-col overflow-hidden rounded-lg border-2">
        <div
          className="bg-tertiary-bg relative w-full overflow-hidden"
          style={{ aspectRatio: "854 / 480" }}
        >
          <div className="absolute top-2 right-2 z-10">
            <Skeleton
              className="rounded-full"
              style={{ width: 20, height: 20 }}
            />
          </div>
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="flex flex-1 flex-col space-y-2 p-2 sm:space-y-4 sm:p-4">
          {/* Title */}
          <div className="flex items-center justify-between gap-2">
            <Skeleton style={{ width: 140, height: 20 }} />
          </div>

          {/* Type / tradable badges */}
          <div className="flex flex-wrap gap-1 pb-2 sm:gap-2">
            <Skeleton
              className="rounded-lg"
              style={{ width: 72, height: 24 }}
            />
            <Skeleton
              className="hidden rounded-lg sm:inline-flex"
              style={{ width: 96, height: 24 }}
            />
          </div>

          {/* Value rows */}
          <div className="space-y-1 pb-2 sm:space-y-2">
            <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
              <Skeleton style={{ width: 64, height: 14 }} />
              <Skeleton
                className="rounded-lg"
                style={{ width: 56, height: 22 }}
              />
            </div>

            <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
              <Skeleton style={{ width: 72, height: 14 }} />
              <Skeleton
                className="rounded-lg"
                style={{ width: 56, height: 22 }}
              />
            </div>

            <div className="border-border-card bg-tertiary-bg grid grid-cols-2 rounded-lg border">
              <div className="flex flex-col gap-1 p-1 sm:p-2.5">
                <Skeleton style={{ width: 50, height: 12 }} />
                <Skeleton
                  className="rounded-lg"
                  style={{ width: 60, height: 22 }}
                />
              </div>
              <div className="border-border-card flex flex-col gap-1 border-l p-1 sm:p-2.5">
                <Skeleton style={{ width: 40, height: 12 }} />
                <Skeleton
                  className="rounded-lg"
                  style={{ width: 60, height: 22 }}
                />
              </div>
            </div>

            <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
              <Skeleton style={{ width: 50, height: 14 }} />
              <Skeleton
                className="rounded-lg"
                style={{ width: 56, height: 22 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-border-card mt-auto flex flex-col gap-1 border-t pt-1 sm:flex-row sm:items-center sm:justify-between sm:pt-2">
            <Skeleton style={{ width: 110, height: 12 }} />
            <Skeleton style={{ width: 90, height: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
