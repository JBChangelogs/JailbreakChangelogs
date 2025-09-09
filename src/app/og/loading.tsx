import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function OGFinderLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="mb-6 text-3xl font-bold">OG Finder</h1>

      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Search for items that were originally owned by a specific user. Enter a
        Roblox ID or username to find their original items.
      </p>

      <div className="space-y-6">
        {/* Search Form Loading */}
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div>
              <div className="mb-2 h-4 w-32 rounded bg-gray-600"></div>
              <div className="h-10 w-full rounded bg-gray-600"></div>
            </div>
            <div className="h-10 w-full rounded bg-gray-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
