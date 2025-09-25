import { Skeleton } from "@mui/material";

export default function ItemCardSkeleton() {
  return (
    <div className="w-full">
      <div className="group border-border-primary hover:border-border-focus bg-secondary-bg relative flex flex-col overflow-hidden rounded-lg border">
        <div className="aspect-h-1 aspect-w-1 bg-primary-bg w-full overflow-hidden rounded-t-lg">
          <Skeleton
            variant="rectangular"
            height="100%"
            className="bg-primary-bg"
          />
        </div>
        <div className="flex flex-1 flex-col space-y-2 p-2 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between">
            <Skeleton
              variant="text"
              width={128}
              height={24}
              className="bg-secondary-bg"
            />
          </div>

          <div className="flex flex-wrap gap-1 pb-2 sm:gap-2">
            <Skeleton
              variant="rounded"
              width={64}
              height={24}
              className="bg-secondary-bg"
            />
            <Skeleton
              variant="rounded"
              width={64}
              height={24}
              className="bg-secondary-bg"
            />
          </div>

          <div className="space-y-1 pb-2 sm:space-y-2">
            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <Skeleton
                variant="text"
                width={64}
                height={16}
                className="bg-secondary-bg"
              />
              <Skeleton
                variant="rounded"
                width={96}
                height={16}
                className="bg-secondary-bg"
              />
            </div>

            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <Skeleton
                variant="text"
                width={64}
                height={16}
                className="bg-secondary-bg"
              />
              <Skeleton
                variant="rounded"
                width={80}
                height={16}
                className="bg-secondary-bg"
              />
            </div>

            <div className="bg-secondary-bg flex items-center justify-between rounded-lg p-1 sm:p-2.5">
              <Skeleton
                variant="text"
                width={64}
                height={16}
                className="bg-secondary-bg"
              />
              <Skeleton
                variant="rounded"
                width={80}
                height={16}
                className="bg-secondary-bg"
              />
            </div>
          </div>

          <div className="text-secondary-text border-secondary-text mt-auto border-t pt-1 text-[10px] sm:pt-2 sm:text-xs">
            <Skeleton
              variant="text"
              width={128}
              height={12}
              className="bg-secondary-bg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
