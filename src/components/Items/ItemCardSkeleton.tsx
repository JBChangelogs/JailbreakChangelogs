import { Skeleton } from "@/components/ui/skeleton";

export default function ItemCardSkeleton() {
  return (
    <div className="h-full w-full">
      <div className="border-border-card bg-secondary-bg relative flex h-full flex-col overflow-hidden rounded-lg border-2">
        <div
          className="bg-tertiary-bg relative w-full shrink-0 overflow-hidden"
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
        <div className="flex flex-1 flex-col space-y-1.5 p-2 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-3/4 sm:h-5" />
          </div>

          <div className="flex flex-wrap gap-1 sm:gap-2">
            <Skeleton className="h-5 w-14 rounded-md sm:h-6" />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="border-border-card divide-border-card bg-tertiary-bg grid grid-cols-2 divide-x rounded-lg border">
              {[0, 1].map((column) => (
                <div
                  key={column}
                  className="flex min-w-0 flex-col gap-1 p-1.5 sm:gap-1.5 sm:p-3"
                >
                  <Skeleton className="h-4 w-10" />
                  <div className="flex flex-col gap-0.5">
                    <Skeleton className="hidden h-3 w-8 sm:block" />
                    <Skeleton className="h-5 w-12 max-w-full rounded-md sm:h-6" />
                  </div>
                  <div className="flex min-h-[50px] flex-col gap-0.5 sm:min-h-0">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-8 w-full max-w-16 rounded-md sm:h-5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="border-border-card bg-tertiary-bg flex items-center justify-between rounded-lg border p-1 sm:p-2.5">
              <Skeleton className="h-3 w-9" />
              <Skeleton className="h-5 w-14 rounded-md sm:h-6" />
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1 sm:pt-2">
            <Skeleton className="h-3 w-24 sm:w-28" />
            <Skeleton className="h-3 w-9 sm:w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
