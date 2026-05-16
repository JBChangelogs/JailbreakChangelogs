import { Skeleton } from "@/components/ui/skeleton";

export default function ItemCardSkeleton() {
  return (
    <div className="w-full">
      <div className="border-border-card bg-secondary-bg relative flex flex-col overflow-hidden rounded-lg border">
        <div className="aspect-h-1 aspect-w-1 bg-primary-bg w-full overflow-hidden rounded-t-lg">
          <Skeleton className="rounded-none" style={{ height: "100%" }} />
        </div>
        <div className="flex flex-1 flex-col space-y-2 p-2 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between">
            <Skeleton style={{ width: 128, height: 24 }} />
          </div>

          <div className="flex flex-wrap gap-1 pb-2 sm:gap-2">
            <Skeleton style={{ width: 64, height: 24 }} />
            <Skeleton style={{ width: 64, height: 24 }} />
          </div>

          <div className="space-y-1 pb-2 sm:space-y-2">
            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <Skeleton style={{ width: 64, height: 16 }} />
              <Skeleton style={{ width: 96, height: 16 }} />
            </div>

            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <Skeleton style={{ width: 64, height: 16 }} />
              <Skeleton style={{ width: 80, height: 16 }} />
            </div>

            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <Skeleton style={{ width: 64, height: 16 }} />
              <Skeleton style={{ width: 80, height: 16 }} />
            </div>
          </div>

          <div className="border-secondary-text text-secondary-text mt-auto border-t pt-1 text-[10px] sm:pt-2 sm:text-xs">
            <Skeleton style={{ width: 128, height: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
