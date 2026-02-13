import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb loading={true} />

      <div className="mb-8">
        <div className="border-border-card bg-button-secondary mb-4 h-10 w-80 animate-pulse rounded border" />
        <div className="border-border-card bg-button-secondary h-5 w-full max-w-3xl animate-pulse rounded border" />
      </div>

      <div className="border-border-card bg-secondary-bg rounded-lg border p-6">
        <div className="bg-button-secondary mb-4 h-5 w-40 animate-pulse rounded" />

        <div className="space-y-4">
          <div className="bg-button-secondary h-4 w-full animate-pulse rounded" />
          <div className="bg-button-secondary h-4 w-5/6 animate-pulse rounded" />
          <div className="bg-button-secondary h-4 w-2/3 animate-pulse rounded" />
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-button-secondary border-border-card h-12 w-full animate-pulse rounded border" />
          <div className="bg-button-secondary border-border-card h-12 w-full animate-pulse rounded border" />
        </div>
      </div>
    </div>
  );
}
