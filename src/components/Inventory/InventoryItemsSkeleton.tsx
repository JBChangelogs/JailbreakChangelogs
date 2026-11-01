export default function InventoryItemsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading inventory items"
      className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="border-border-card bg-tertiary-bg animate-pulse rounded-lg border p-3"
        >
          <div className="mb-4">
            <div className="bg-button-secondary mb-2 h-7 w-3/4 rounded"></div>
            <div className="bg-button-secondary h-6 w-24 rounded-md"></div>
          </div>

          <div className="bg-button-secondary mb-3 aspect-video w-full rounded-lg"></div>

          <div className="mb-3 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-1">
                <div className="bg-button-secondary h-3 w-16 rounded" />
                <div className="bg-button-secondary h-5 w-20 rounded" />
              </div>
            ))}
          </div>
          <div className="mb-3 flex items-center gap-2">
            <div className="bg-button-secondary h-8 w-8 rounded-full" />
            <div className="bg-button-secondary h-4 w-24 rounded" />
          </div>
          <div className="bg-button-secondary ml-auto h-8 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}
