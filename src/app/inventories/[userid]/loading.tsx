import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      {/* Header skeleton */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-64 animate-pulse rounded bg-[#37424D]"></div>
        <div className="h-6 w-12 animate-pulse rounded bg-[#37424D]"></div>
      </div>

      {/* Experimental banner skeleton */}
      <div className="mb-6 h-12 w-full animate-pulse rounded-lg bg-[#37424D]"></div>

      {/* Search form skeleton */}
      <div className="mb-6 animate-pulse rounded-lg border border-[#2E3944] bg-[#212A31] p-6 shadow-sm">
        <div className="mb-4 h-6 w-48 rounded bg-[#37424D]"></div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-12 flex-1 rounded bg-[#37424D]"></div>
          <div className="h-12 w-full rounded bg-[#37424D] sm:w-32"></div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="mb-2 h-8 animate-pulse rounded bg-[#37424D]"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-[#37424D]"></div>
        </div>
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="mb-2 h-8 animate-pulse rounded bg-[#37424D]"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-[#37424D]"></div>
        </div>
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="mb-2 h-8 animate-pulse rounded bg-[#37424D]"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-[#37424D]"></div>
        </div>
      </div>
    </div>
  );
}
