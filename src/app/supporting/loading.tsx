export default function SupportingLoading() {
  return (
    <div className="min-h-screen pb-8">
      {/* Breadcrumb skeleton */}
      <div className="container mx-auto px-4 sm:px-6">
        <div className="bg-secondary-bg mb-4 h-6 w-48 animate-pulse rounded"></div>
      </div>

      {/* Header section skeleton */}
      <section className="bg-primary-bg">
        <div className="container mx-auto px-4 pt-2 pb-8 sm:px-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="bg-secondary-bg mb-4 h-8 w-64 animate-pulse rounded lg:h-10"></div>
              <div className="bg-secondary-bg h-6 w-96 animate-pulse rounded"></div>
            </div>
          </div>

          {/* Pricing cards skeleton */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-border-primary bg-secondary-bg rounded-2xl border p-8 shadow-lg"
              >
                <div className="bg-tertiary-bg mb-4 h-6 w-32 animate-pulse rounded"></div>
                <div className="bg-tertiary-bg mb-6 h-12 w-24 animate-pulse rounded"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div
                      key={j}
                      className="bg-tertiary-bg h-4 w-full animate-pulse rounded"
                    ></div>
                  ))}
                </div>
                <div className="bg-tertiary-bg mt-8 h-12 w-full animate-pulse rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supporters section skeleton */}
      <div className="mt-8 py-8">
        <div className="mb-12 flex justify-center">
          <div className="bg-secondary-bg h-10 w-96 animate-pulse rounded"></div>
        </div>

        <div className="container mx-auto px-4">
          {/* Tier sections skeleton */}
          {[1, 2, 3].map((tier) => (
            <div key={tier} className="mb-12">
              <div className="mb-6 flex justify-center">
                <div className="bg-secondary-bg h-12 w-48 animate-pulse rounded-full"></div>
              </div>
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((card) => (
                  <div
                    key={card}
                    className="border-border-primary bg-secondary-bg flex-shrink-0 rounded-xl border p-6 shadow-md"
                    style={{ width: "280px" }}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="bg-tertiary-bg h-16 w-16 animate-pulse rounded-full"></div>
                      <div className="w-full space-y-2">
                        <div className="bg-tertiary-bg mx-auto h-5 w-32 animate-pulse rounded"></div>
                        <div className="bg-tertiary-bg mx-auto h-4 w-24 animate-pulse rounded"></div>
                        <div className="bg-tertiary-bg mx-auto h-6 w-28 animate-pulse rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
