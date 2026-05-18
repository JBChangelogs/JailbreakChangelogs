import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

function ReportCardSkeleton() {
  return (
    <div className="border-border-card bg-secondary-bg flex flex-col rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <Skeleton style={{ width: 64, height: 22 }} />
          <Skeleton style={{ width: 100, height: 22 }} />
        </div>
        <Skeleton style={{ width: 80, height: 16 }} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Skeleton style={{ width: 78, height: 14 }} />
        <Skeleton style={{ width: 28, height: 28 }} className="rounded-full" />
        <Skeleton style={{ width: 90, height: 14 }} />
      </div>
      <div className="border-border-card bg-tertiary-bg mt-2 rounded-lg border p-3">
        <Skeleton style={{ width: 100, height: 12 }} />
        <Skeleton style={{ width: "100%", height: 14 }} className="mt-1" />
      </div>
      <Skeleton style={{ width: "75%", height: 14 }} className="mt-2" />
      <div className="mt-1 space-y-1">
        <Skeleton style={{ width: 130, height: 12 }} />
        <Skeleton style={{ width: 170, height: 12 }} />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen pb-8">
      <div className="container mx-auto max-w-7xl px-4">
        <Breadcrumb loading={true} />

        {/* Heading */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton style={{ width: 140, height: 24 }} />
        </div>

        {/* Search controls */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-1/3">
            <Skeleton style={{ height: 56 }} />
          </div>
          <div className="grid w-full grid-cols-2 gap-4 lg:flex lg:flex-1 lg:gap-4">
            <Skeleton style={{ height: 56 }} />
            <Skeleton style={{ height: 56 }} />
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
