export default function SupportersSectionLoading() {
  return (
    <div className="mt-8 py-8">
      <div className="mb-12 flex justify-center">
        <div className="h-10 w-96 animate-pulse rounded bg-secondary-bg"></div>
      </div>

      <div className="container mx-auto px-4">
        {/* Tier sections skeleton */}
        {[1, 2, 3].map((tier) => (
          <div key={tier} className="mb-12">
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-48 animate-pulse rounded-full bg-secondary-bg"></div>
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((card) => (
                <div
                  key={card}
                  className="bg-secondary-bg border-border-primary flex-shrink-0 rounded-xl border p-6 shadow-md"
                  style={{ width: "280px" }}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-16 w-16 animate-pulse rounded-full bg-tertiary-bg"></div>
                    <div className="w-full space-y-2">
                      <div className="mx-auto h-5 w-32 animate-pulse rounded bg-tertiary-bg"></div>
                      <div className="mx-auto h-4 w-24 animate-pulse rounded bg-tertiary-bg"></div>
                      <div className="mx-auto h-6 w-28 animate-pulse rounded-full bg-tertiary-bg"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
