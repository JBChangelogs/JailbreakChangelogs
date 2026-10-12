import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-button-secondary h-9 w-48 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-6 w-12 animate-pulse rounded"></div>
      </div>

      {/* Experimental Feature Banner */}
      <div className="border-border-card bg-button-info/10 mb-6 rounded-lg border p-4 shadow-sm">
        <div className="animate-pulse space-y-2">
          <div className="bg-button-secondary h-4 w-full rounded"></div>
          <div className="bg-button-secondary h-4 w-3/4 rounded"></div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <div className="animate-pulse">
          <div className="bg-button-secondary h-4 w-full rounded"></div>
        </div>
      </div>

      {/* Search Form */}
      <div className="mb-8 animate-pulse">
        <div className="bg-button-secondary h-12 w-full rounded-lg"></div>
      </div>

      {/* FAQ Section */}
      <div className="border-border-card bg-secondary-bg rounded-lg border p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="bg-button-secondary h-6 w-48 rounded"></div>
          <div className="space-y-3">
            <div className="bg-button-secondary h-4 w-full rounded"></div>
            <div className="bg-button-secondary h-4 w-5/6 rounded"></div>
            <div className="bg-button-secondary h-4 w-4/5 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
