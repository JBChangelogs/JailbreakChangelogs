import Breadcrumb from '@/components/Layout/Breadcrumb';

export default function OGFinderLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">OG Finder</h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Search for items that were originally owned by a specific user. Enter a Roblox ID or username to find their original items.
      </p>
      
      <div className="space-y-6">
        {/* Search Form Loading */}
        <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
          <div className="animate-pulse space-y-4">
            <div>
              <div className="h-4 bg-gray-600 rounded w-32 mb-2"></div>
              <div className="h-10 bg-gray-600 rounded w-full"></div>
            </div>
            <div className="h-10 bg-gray-600 rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
