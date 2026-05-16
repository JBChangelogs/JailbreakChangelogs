import { Skeleton } from "@/components/ui/skeleton";

export default function UserCardSkeleton() {
  return (
    <div className="border-border-card group bg-secondary-bg relative block rounded-lg border p-4 shadow-md transition-colors">
      <div className="flex items-center space-x-3">
        <Skeleton className="rounded-full" style={{ width: 48, height: 48 }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Skeleton style={{ width: 180, height: 20 }} />
            <Skeleton
              className="rounded-full"
              style={{ width: 16, height: 16 }}
            />
          </div>
          <Skeleton className="mt-1" style={{ width: 120, height: 16 }} />
        </div>
      </div>
    </div>
  );
}
