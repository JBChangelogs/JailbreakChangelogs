import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function SeasonLeaderboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <div className="bg-secondary-bg h-9 w-64 animate-pulse rounded" />
        <div className="bg-secondary-bg mt-2 h-5 w-96 animate-pulse rounded" />
        <div className="bg-secondary-bg mt-3 h-12 w-full animate-pulse rounded-lg" />
      </div>

      <div className="mt-8">
        <div className="bg-secondary-bg mb-4 h-6 w-48 animate-pulse rounded" />
        <div className="bg-secondary-bg mb-6 h-10 w-full animate-pulse rounded-lg" />
        <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4 shadow-sm">
          <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="border-border-primary hover:border-border-focus flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-tertiary-bg h-8 w-8 animate-pulse rounded-full" />
                  <div className="bg-tertiary-bg h-8 w-8 animate-pulse rounded-full" />
                  <div className="flex flex-col space-y-2">
                    <div className="bg-tertiary-bg h-4 w-32 animate-pulse rounded" />
                    <div className="bg-tertiary-bg h-3 w-24 animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="bg-tertiary-bg h-5 w-20 animate-pulse rounded" />
                  <div className="bg-tertiary-bg h-3 w-24 animate-pulse rounded" />
                  <div className="bg-tertiary-bg h-3 w-24 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
