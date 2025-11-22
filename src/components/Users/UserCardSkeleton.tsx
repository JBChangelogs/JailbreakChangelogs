import { Skeleton } from "@mui/material";

export default function UserCardSkeleton() {
  return (
    <div className="border-border-primary bg-secondary-bg group hover:border-border-focus relative block rounded-lg border p-4 shadow-md transition-colors">
      <div className="flex items-center space-x-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Skeleton
              variant="text"
              width={180}
              height={20}
              className="bg-secondary-bg"
            />
            <Skeleton
              variant="circular"
              width={16}
              height={16}
              className="bg-secondary-bg"
            />
          </div>
          <Skeleton
            variant="text"
            width={120}
            height={16}
            className="bg-secondary-bg mt-1"
          />
        </div>
      </div>
    </div>
  );
}
