import Breadcrumb from '@/components/Layout/Breadcrumb';

export default function InventoryCheckerLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Inventory Checker</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Enter a Roblox ID or username to check their Jailbreak inventory.
      </p>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944] animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-32"></div>
        </div>
        <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944] animate-pulse">
          <div className="h-8 bg-gray-600 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-32"></div>
        </div>
      </div>
      
      {/* Inventory Checker Form Skeleton */}
      <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944] mb-8 animate-pulse">
        <div className="h-6 bg-gray-600 rounded w-48 mb-4"></div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 h-12 bg-gray-600 rounded"></div>
          <div className="w-full sm:w-32 h-12 bg-gray-600 rounded"></div>
        </div>
      </div>
      
      {/* Leaderboard Skeleton */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-gray-300">Most Scanned Players</h2>
        <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
          <div className="space-y-3">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D] animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                  <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="h-5 bg-gray-600 rounded w-32 mb-2"></div>
                      <div className="h-4 bg-gray-600 rounded w-24"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-600 rounded"></div>
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
