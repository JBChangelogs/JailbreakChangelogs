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
        <div className="border-border-primary animate-pulse rounded-lg border p-4 shadow-sm">
          <div className="bg-button-secondary mb-2 h-8 w-24 rounded"></div>
          <div className="bg-button-secondary h-4 w-32 rounded"></div>
        </div>
        <div className="border-border-primary animate-pulse rounded-lg border p-4 shadow-sm">
          <div className="bg-button-secondary mb-2 h-8 w-24 rounded"></div>
          <div className="bg-button-secondary h-4 w-32 rounded"></div>
        </div>
      </div>

      {/* Inventory Checker Form Skeleton */}
      <div className="border-border-primary mb-8 animate-pulse rounded-lg border p-6 shadow-sm">
        <div className="bg-button-secondary mb-4 h-6 w-48 rounded"></div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="bg-button-secondary h-12 flex-1 rounded"></div>
          <div className="bg-button-secondary h-12 w-full rounded sm:w-32"></div>
        </div>
      </div>

      {/* Leaderboard Skeleton */}
      <div className="mt-8">
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="space-y-3">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="border-border-primary bg-tertiary-bg flex animate-pulse flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-button-secondary h-8 w-8 rounded-full"></div>
                  <div className="bg-button-secondary h-10 w-10 rounded-full"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="bg-button-secondary mb-2 h-5 w-32 rounded"></div>
                      <div className="bg-button-secondary h-4 w-24 rounded"></div>
                    </div>
                    <div className="bg-button-secondary h-6 w-6 rounded"></div>
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
