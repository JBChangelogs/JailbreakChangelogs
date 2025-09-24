import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function MoneyLeaderboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <div className="h-9 w-64 animate-pulse rounded" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded" />
      </div>

      <div className="mt-8">
        <div className="mb-4 h-6 w-48 animate-pulse rounded" />
        <div className="border-stroke bg-secondary-bg rounded-lg border p-4 shadow-sm">
          <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="border-stroke flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-secondary-bg h-8 w-8 animate-pulse rounded-full" />
                  <div className="bg-secondary-bg h-8 w-8 animate-pulse rounded-full" />
                  <div className="flex flex-col space-y-2">
                    <div className="bg-secondary-bg h-4 w-32 animate-pulse rounded" />
                    <div className="bg-secondary-bg h-3 w-24 animate-pulse rounded" />
                  </div>
                </div>
                <div className="bg-secondary-bg h-6 w-24 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
