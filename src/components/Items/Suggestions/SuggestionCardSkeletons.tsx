export function SuggestionCardSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="border-border-card bg-secondary-bg relative flex animate-pulse flex-col overflow-hidden rounded-xl border"
        >
          <div
            className="bg-tertiary-bg relative block w-full"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="border-border-card relative z-10 flex flex-col border-t">
            <div className="flex items-stretch">
              <div className="bg-quaternary-bg flex flex-1 items-center justify-center gap-1.5 py-2.5">
                <div className="bg-quaternary-bg h-3 w-3 rounded-full" />
                <div className="bg-quaternary-bg h-4 w-6 rounded" />
              </div>
              <div className="border-border-card border-l" />
              <div className="bg-quaternary-bg flex flex-1 items-center justify-center gap-1.5 py-2.5">
                <div className="bg-quaternary-bg h-3 w-3 rounded-full" />
                <div className="bg-quaternary-bg h-4 w-6 rounded" />
              </div>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="relative z-10 min-w-0">
                <div className="bg-quaternary-bg mb-2 h-5 w-32 rounded" />
                <div className="flex flex-wrap gap-1.5">
                  <div className="bg-quaternary-bg h-4 w-12 rounded" />
                  <div className="bg-quaternary-bg h-4 w-16 rounded" />
                  <div className="bg-quaternary-bg h-4 w-12 rounded" />
                </div>
              </div>
              <div className="bg-quaternary-bg h-4 w-4 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3">
                <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                <div className="bg-quaternary-bg h-5 w-16 rounded" />
              </div>
              <div className="p-3">
                <div className="bg-quaternary-bg mb-2 h-3 w-8 rounded" />
                <div className="bg-quaternary-bg h-5 w-16 rounded" />
              </div>
            </div>
            <div className="bg-quaternary-bg mb-1 h-3 w-full rounded" />
            <div className="bg-quaternary-bg mb-4 h-3 w-2/3 rounded" />
            <div className="mt-auto pt-1">
              <div className="bg-quaternary-bg mb-2 h-3 w-16 rounded" />
              <div className="flex items-start gap-2">
                <div className="bg-quaternary-bg h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-quaternary-bg h-3 w-24 rounded" />
                  <div className="bg-quaternary-bg h-3 w-32 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
