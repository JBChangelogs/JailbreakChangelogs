import React from "react";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div
    className={`bg-quaternary-bg/70 animate-pulse rounded-md ${className}`}
    aria-hidden="true"
  />
);

const TradeSideSkeleton = ({ titleWidth }: { titleWidth: string }) => (
  <section className="overflow-hidden">
    <div className="mb-3 flex items-center justify-center">
      <SkeletonBlock className={`h-4 ${titleWidth}`} />
    </div>
    <div className="border-border-card bg-tertiary-bg/40 rounded-xl border">
      <div className="border-border-card grid grid-cols-[1fr_auto] gap-3 border-b px-3 py-2">
        <SkeletonBlock className="h-3 w-10" />
        <SkeletonBlock className="ml-auto h-3 w-8" />
      </div>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="border-border-card grid grid-cols-[1fr_auto] items-center gap-3 border-b px-3 py-2 last:border-b-0"
        >
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="hidden aspect-video w-28 rounded-lg min-[376px]:block" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-6 w-20 rounded-lg" />
              </div>
              <div className="mt-2">
                <SkeletonBlock className="h-3 w-32" />
              </div>
            </div>
          </div>
          <SkeletonBlock className="h-4 w-8" />
        </div>
      ))}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <SkeletonBlock className="h-6 w-24 rounded-lg" />
      <SkeletonBlock className="h-6 w-24 rounded-lg" />
    </div>
  </section>
);

export const TradeAdDetailsSkeleton: React.FC = () => {
  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
      <div className="bg-tertiary-bg border-border-card -mx-6 -mt-6 mb-4 flex flex-col gap-3 border-b px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-4 w-10" />
              </div>
              <div className="mt-2">
                <SkeletonBlock className="h-3 w-24" />
              </div>
              <div className="mt-2 hidden items-center gap-2 sm:flex">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SkeletonBlock className="h-9 w-28 rounded-md" />
            <SkeletonBlock className="hidden h-9 w-32 rounded-md sm:block" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-3 w-3 rounded-full" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      </div>

      <div className="mb-4">
        <SkeletonBlock className="mb-2 h-3 w-16" />
        <SkeletonBlock className="h-4 w-full max-w-2xl" />
        <SkeletonBlock className="mt-2 h-4 w-5/6 max-w-xl" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TradeSideSkeleton titleWidth="w-28" />
        <TradeSideSkeleton titleWidth="w-32" />
      </div>

      <div className="mt-8">
        <div className="w-full overflow-x-auto">
          <div className="bg-tertiary-bg grid w-full min-w-0 grid-cols-2 gap-2 rounded-xl p-1">
            <SkeletonBlock className="h-10 w-full rounded-lg" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-[56px] flex-1 rounded-lg" />
            <SkeletonBlock className="h-[56px] w-full rounded-lg sm:w-56" />
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-6">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-4 w-full max-w-3xl" />
            <SkeletonBlock className="mt-2 h-4 w-2/3" />
          </div>
          <div className="border-border-card bg-tertiary-bg rounded-lg border p-6">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
