export default function InventoryItemsSkeleton({
  variant = "inventory",
}: {
  variant?: "inventory" | "og" | "dupes";
} = {}) {
  return (
    <div
      role="status"
      aria-label={`Loading ${variant} items`}
      className="mb-8 grid grid-cols-1 gap-4 min-[375px]:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="border-border-card bg-tertiary-bg flex animate-pulse flex-col rounded-lg border p-3"
        >
          <div className="mb-4">
            <div className="bg-button-secondary mb-1 h-8 w-3/4 rounded"></div>
            <div className="bg-button-secondary h-6 w-24 rounded-md"></div>
          </div>

          <div className="bg-button-secondary mb-3 aspect-video w-full rounded-lg"></div>

          <div className="border-border-card bg-secondary-bg mb-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border p-2.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="bg-button-secondary mb-1 h-4 w-16 rounded" />
                <div className="bg-button-secondary h-6 w-20 rounded-md" />
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="bg-button-secondary h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="bg-button-secondary h-4 w-20 rounded" />
                <div className="bg-button-secondary h-5 w-24 rounded" />
              </div>
            </div>
            {variant === "dupes" ? (
              <>
                <div className="bg-button-secondary h-4 w-32 rounded" />
                <div className="mt-auto grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-button-secondary h-8 rounded"
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="bg-button-secondary h-5 w-32 rounded" />
                <div className="bg-button-secondary h-8 w-20 rounded" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
