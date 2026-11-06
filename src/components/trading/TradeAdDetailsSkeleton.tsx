import React from "react";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div
    className={`bg-quaternary-bg/70 animate-pulse rounded-md ${className}`}
    aria-hidden="true"
  />
);

const TradeSideSkeleton = ({ titleWidth }: { titleWidth: string }) => (
  <section className="border-border-card bg-tertiary-bg flex min-w-0 flex-col overflow-hidden rounded-xl border p-3 sm:p-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <SkeletonBlock className="size-9 shrink-0 rounded-lg" />
        <SkeletonBlock className={`h-4 ${titleWidth}`} />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="ml-auto h-2.5 w-16" />
        <SkeletonBlock className="h-6 w-28" />
      </div>
    </div>

    <div className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border lg:hidden">
      <div className="border-border-card border-b px-3 py-2">
        <SkeletonBlock className="h-3 w-10" />
      </div>
      {[0, 1].map((row) => (
        <div
          key={row}
          className="border-border-card flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
        >
          <SkeletonBlock className="hidden aspect-video w-28 shrink-0 rounded-lg min-[376px]:block" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-full max-w-28" />
            <SkeletonBlock className="h-6 w-16" />
            <SkeletonBlock className="h-5 w-24 max-w-full" />
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>

    <div className="hidden flex-wrap items-start gap-3 lg:flex">
      {[0, 1].map((card) => (
        <div
          key={card}
          className="border-border-card bg-secondary-bg min-w-0 flex-1 overflow-hidden rounded-lg border"
        >
          <SkeletonBlock className="aspect-video max-h-32 w-full rounded-none" />
          <div className="space-y-2 p-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-6 w-16" />
            <div className="flex items-center justify-between gap-2">
              <SkeletonBlock className="h-3 w-10" />
              <SkeletonBlock className="h-6 w-20" />
            </div>
            <div className="border-border-card space-y-2 border-t pt-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <SkeletonBlock className="mt-3 h-6 w-32" />
  </section>
);

export const TradeAdDetailsSkeleton: React.FC = () => {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-7 w-20 rounded-full" />
      </div>
      <div className="border-border-card bg-secondary-bg w-full overflow-hidden rounded-xl border p-6">
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

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <TradeSideSkeleton titleWidth="w-28" />
          <TradeSideSkeleton titleWidth="w-32" />
        </div>
      </div>

      <div className="mt-8">
        <div className="border-border-card grid grid-cols-2 gap-2 border-b py-3">
          <SkeletonBlock className="mx-auto h-4 w-28" />
          <SkeletonBlock className="mx-auto h-4 w-20" />
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-14 flex-1 rounded-lg" />
            <SkeletonBlock className="h-14 w-full rounded-lg sm:w-56" />
          </div>
          <div className="border-border-card bg-secondary-bg overflow-hidden rounded-xl border">
            <div className="border-border-card bg-tertiary-bg flex items-start justify-between gap-3 border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="size-10 shrink-0 rounded-full" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>
              </div>
              <SkeletonBlock className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-1 items-start gap-4 p-4 lg:grid-cols-2">
              <TradeSideSkeleton titleWidth="w-28" />
              <TradeSideSkeleton titleWidth="w-32" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
