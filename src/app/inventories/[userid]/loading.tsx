import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-button-secondary h-9 w-64 animate-pulse rounded"></div>
      </div>

      {/* Experimental banner skeleton */}
      <div className="bg-button-secondary mb-6 h-12 w-full animate-pulse rounded-lg"></div>

      {/* Search form skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="bg-button-secondary h-12 w-full rounded-lg"></div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
          <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
        </div>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
          <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
        </div>
        <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
          <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
          <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
        </div>
      </div>
    </div>
  );
}
