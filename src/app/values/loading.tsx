import { Skeleton } from "@/components/ui/skeleton";
import ItemCardSkeleton from "@/components/Items/ItemCardSkeleton";

export default function Loading() {
  return (
    <main className="mb-8 min-h-screen">
      <div className="container mx-auto px-4">
        {/* Single card matching ValuesClient's header card */}
        <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-6">
          <Skeleton className="mb-4 h-9 w-72" />
          <Skeleton className="mb-2 h-5 w-full" />
          <Skeleton className="mb-4 h-5 w-4/5" />

          {/* Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-44 rounded-md" />
            <Skeleton className="h-9 w-36 rounded-md" />
          </div>

          {/* Suggestions banner */}
          <Skeleton className="mb-4 h-12 w-full rounded-lg" />

          {/* Last updated */}
          <Skeleton className="mb-6 h-4 w-56" />

          {/* Category icons */}
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-24 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Search and filter controls */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row">
          <Skeleton className="h-12 w-full rounded-lg lg:w-1/3" />
          <Skeleton className="h-12 w-full rounded-lg lg:flex-1" />
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
