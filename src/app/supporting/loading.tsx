import SupportersSectionLoading from "@/components/Support/SupportersSectionLoading";

export default function SupportingLoading() {
  return (
    <div className="min-h-screen pb-8">
      {/* Breadcrumb skeleton */}
      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-quaternary-bg/70 mb-4 h-6 w-48 animate-pulse rounded"></div>
      </div>

      {/* Header section skeleton */}
      <section className="bg-primary-bg">
        <div className="container mx-auto px-4 pt-2 pb-8 sm:px-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="bg-quaternary-bg/70 mb-4 h-8 w-64 animate-pulse rounded lg:h-10"></div>
              <div className="bg-quaternary-bg/70 h-6 w-96 animate-pulse rounded"></div>
            </div>
          </div>

          {/* Pricing cards skeleton */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border-card bg-secondary-bg rounded-2xl border p-8 shadow-lg"
              >
                <div className="bg-quaternary-bg/70 mb-4 h-6 w-32 animate-pulse rounded"></div>
                <div className="bg-quaternary-bg/70 mb-6 h-12 w-24 animate-pulse rounded"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="bg-quaternary-bg/70 h-4 w-full animate-pulse rounded"
                    ></div>
                  ))}
                </div>
                <div className="bg-quaternary-bg/70 mt-8 h-12 w-full animate-pulse rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SupportersSectionLoading />
    </div>
  );
}
