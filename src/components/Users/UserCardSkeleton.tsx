import { Skeleton } from "@/components/ui/skeleton";

export default function UserCardSkeleton() {
  return (
    <div className="border-border-card bg-secondary-bg relative block overflow-hidden rounded-xl border shadow-md">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="px-4 pb-4">
        <div className="bg-secondary-bg relative -mt-9 w-fit rounded-full p-1">
          <Skeleton
            className="rounded-full"
            style={{ width: 64, height: 64 }}
          />
        </div>
        <Skeleton className="mt-2" style={{ width: 160, height: 20 }} />
        <Skeleton className="mt-1" style={{ width: 110, height: 16 }} />
        <Skeleton className="mt-3 mb-3" style={{ width: 150, height: 20 }} />
        <div className="border-border-card border-t pt-3">
          <Skeleton style={{ width: 170, height: 14 }} />
        </div>
      </div>
    </div>
  );
}
