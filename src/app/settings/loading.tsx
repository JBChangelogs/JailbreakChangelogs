import { Skeleton } from "@/components/ui/skeleton";

const cardClassName =
  "border-border-card bg-secondary-bg rounded-xl border shadow-md";

export default function SettingsLoading() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] min-[1200px]:items-start min-[1200px]:gap-8">
        {/* Sidebar Skeleton */}
        <div className="hidden min-[1200px]:sticky min-[1200px]:top-[100px] min-[1200px]:block min-[1200px]:h-fit">
          <div className={`${cardClassName} p-4`}>
            <Skeleton className="mx-2 mb-2 h-4 w-3/5" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-2 py-1.5">
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${cardClassName} mb-8 p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-7 w-2/5" />
              </div>
              <div className="border-border-card mb-4 border-t" />
              <div className="flex flex-col">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="mb-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <Skeleton className="h-5 w-[35%]" />
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-[70%]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
