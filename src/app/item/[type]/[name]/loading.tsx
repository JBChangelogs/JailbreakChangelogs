import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton
            className="rounded-full"
            style={{ width: 20, height: 20 }}
          />
          <Skeleton style={{ width: 120, height: 24 }} />
        </div>

        {/* Header section skeleton */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row">
          {/* Image/Video skeleton */}
          <div className="shrink-0">
            <Skeleton style={{ width: 320, height: 180 }} />
          </div>
          {/* Main info skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton style={{ width: 220, height: 40 }} />
            <Skeleton style={{ width: 120, height: 28 }} />
            <Skeleton style={{ width: 180, height: 24 }} />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} style={{ width: 60, height: 28 }} />
              ))}
            </div>
            <Skeleton style={{ width: 160, height: 20 }} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mb-8">
          <div className="mb-4 flex gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} style={{ width: 100, height: 32 }} />
            ))}
          </div>
          {/* Tab content skeleton */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} style={{ width: "100%", height: 20 }} />
            ))}
          </div>
        </div>

        {/* Similar items skeleton */}
        <div className="mb-8">
          <Skeleton style={{ width: 180, height: 28 }} />
          <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} style={{ width: 150, height: 90 }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
