export default function MostDuplicatedItemsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-border-card bg-secondary-bg mt-6 mb-6 overflow-hidden rounded-xl border"
    >
      <div className="border-border-card border-b px-4 py-5 sm:px-6">
        <div className="bg-quaternary-bg/70 h-7 w-56 max-w-full animate-pulse rounded" />
        <div className="bg-quaternary-bg/70 mt-1 h-5 w-64 max-w-full animate-pulse rounded" />
      </div>
      <div className="max-h-[32rem] overflow-hidden">
        <div className="grid gap-x-8 px-4 sm:px-6 xl:grid-cols-2">
          {Array.from({ length: 26 }, (_, index) => (
            <div
              key={index}
              className="border-border-card flex items-center gap-3 border-b py-3 last:border-b-0 sm:gap-4 xl:[&:nth-last-child(2)]:border-b-0"
            >
              <div className="bg-quaternary-bg/70 h-4 w-5 shrink-0 animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 aspect-video w-24 shrink-0 animate-pulse rounded-lg sm:w-28" />
              <div className="flex-1">
                <div className="bg-quaternary-bg/70 h-5 w-1/3 animate-pulse rounded" />
                <div className="bg-quaternary-bg/70 mt-1 h-5 w-16 animate-pulse rounded" />
              </div>
              <div className="w-16 shrink-0 sm:w-32">
                <div className="bg-quaternary-bg/70 ml-auto h-6 w-10 animate-pulse rounded" />
                <div className="bg-quaternary-bg/70 mt-2 h-1 animate-pulse rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
