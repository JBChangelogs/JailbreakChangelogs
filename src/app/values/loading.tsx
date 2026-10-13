import { Skeleton } from "@/components/ui/skeleton";
import ItemCardSkeleton from "@/components/Items/ItemCardSkeleton";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        <Breadcrumb loading />
        <div className="mb-6">
          <Skeleton className="mb-4 h-9 w-72" />
          <Skeleton className="mb-2 h-5 w-full" />
          <Skeleton className="mb-4 h-5 w-4/5" />

          <div className="flex flex-wrap gap-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="mb-6">
          <Skeleton className="mb-2 h-7 w-48" />
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }, (_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Search and filter controls */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row">
          <Skeleton className="h-12 w-full rounded-lg lg:w-1/3" />
          <Skeleton className="h-12 w-full rounded-lg lg:flex-1" />
          <Skeleton className="h-12 w-full rounded-lg lg:w-1/3" />
        </div>

        {/* Items grid */}
        <div className="grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(32)].map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
