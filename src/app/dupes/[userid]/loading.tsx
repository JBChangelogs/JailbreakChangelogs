import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-48 animate-pulse rounded bg-gray-600"></div>
        <div className="h-6 w-12 animate-pulse rounded bg-gray-600"></div>
      </div>

      {/* Experimental Feature Banner */}
      <div className="mb-6 rounded-lg border p-4 shadow-sm">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-full rounded bg-gray-600"></div>
          <div className="h-4 w-3/4 rounded bg-gray-600"></div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="animate-pulse">
          <div className="h-4 w-full rounded bg-gray-600"></div>
        </div>
      </div>

      {/* Search Form */}
      <div className="mb-8 rounded-lg border p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div>
            <div className="mb-2 h-4 w-32 rounded bg-gray-600"></div>
            <div className="h-10 w-full rounded bg-gray-600"></div>
          </div>
          <div className="h-10 w-24 rounded bg-gray-600"></div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-lg border p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-600"></div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-gray-600"></div>
            <div className="h-4 w-5/6 rounded bg-gray-600"></div>
            <div className="h-4 w-4/5 rounded bg-gray-600"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
