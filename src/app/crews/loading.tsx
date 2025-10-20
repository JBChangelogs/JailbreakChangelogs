import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="text-primary-text min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb loading={true} />

          {/* Header skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-secondary-bg h-10 w-64 animate-pulse rounded"></div>
            </div>
            <div className="bg-secondary-bg h-6 w-96 animate-pulse rounded"></div>
          </div>

          {/* Crew Leaderboard skeleton */}
          <div className="mt-8">
            <div className="bg-secondary-bg mb-4 h-6 w-48 animate-pulse rounded"></div>
            <div className="border-border-primary hover:border-border-focus bg-secondary-bg rounded-lg border p-4 shadow-sm">
              <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="border-border-primary flex animate-pulse items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="bg-secondary-bg h-8 w-8 rounded-full"></div>
                    <div className="flex-1">
                      <div className="bg-secondary-bg mb-2 h-4 w-3/4 rounded"></div>
                      <div className="bg-secondary-bg h-3 w-1/2 rounded"></div>
                    </div>
                    <div className="text-right">
                      <div className="bg-secondary-bg mb-1 h-4 w-16 rounded"></div>
                      <div className="bg-secondary-bg h-3 w-12 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
