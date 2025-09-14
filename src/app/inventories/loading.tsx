import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function InventoryCheckerLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="mb-6 text-3xl font-bold text-white">Inventory Checker</h1>
      <p className="mb-4 text-white">
        Enter a Roblox ID or username to check their Jailbreak inventory.
      </p>

      {/* Stats Cards Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="animate-pulse rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="mb-2 h-8 w-24 rounded bg-gray-600"></div>
          <div className="h-4 w-32 rounded bg-gray-600"></div>
        </div>
        <div className="animate-pulse rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="mb-2 h-8 w-24 rounded bg-gray-600"></div>
          <div className="h-4 w-32 rounded bg-gray-600"></div>
        </div>
      </div>

      {/* Inventory Checker Form Skeleton */}
      <div className="mb-8 animate-pulse rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <div className="mb-4 h-6 w-48 rounded bg-gray-600"></div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-12 flex-1 rounded bg-gray-600"></div>
          <div className="h-12 w-full rounded bg-gray-600 sm:w-32"></div>
        </div>
      </div>

      {/* Leaderboard Skeleton */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-300">
          Most Scanned Players
        </h2>
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="space-y-3">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse flex-col gap-3 rounded-lg border border-[#37424D] bg-[#2E3944] p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-600"></div>
                  <div className="h-10 w-10 rounded-full bg-gray-600"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 h-5 w-32 rounded bg-gray-600"></div>
                      <div className="h-4 w-24 rounded bg-gray-600"></div>
                    </div>
                    <div className="h-6 w-6 rounded bg-gray-600"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
