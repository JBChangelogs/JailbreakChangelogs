import Breadcrumb from "@/components/Layout/Breadcrumb";
import SeasonHeader from "@/components/Seasons/SeasonHeader";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb loading={true} />
        <SeasonHeader currentSeason={null} nextSeason={null} />

        {/* Season Navigation skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-border-primary bg-button-secondary h-12 animate-pulse rounded-lg border"></div>
            <div className="border-border-primary bg-button-secondary h-12 animate-pulse rounded-lg border"></div>
            <div className="border-border-primary bg-button-secondary h-12 animate-pulse rounded-lg border"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
          <div className="sm:col-span-12 xl:col-span-8">
            <div className="border-border-primary bg-button-secondary mb-4 h-8 w-1/2 animate-pulse rounded border"></div>
            <div className="border-border-primary bg-button-secondary mb-4 h-4 w-full animate-pulse rounded border"></div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4"
                >
                  <div className="bg-secondary-bg mb-2 h-4 w-1/2 animate-pulse rounded"></div>
                  <div className="bg-secondary-bg h-4 w-3/4 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
            <div className="border-border-primary bg-button-secondary mb-4 h-6 w-1/4 animate-pulse rounded border"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="bg-secondary-bg h-4 w-1/3 animate-pulse rounded"></div>
                    <div className="flex gap-2">
                      <div className="bg-secondary-bg h-4 w-16 animate-pulse rounded"></div>
                      <div className="bg-secondary-bg h-4 w-16 animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="bg-secondary-bg h-4 w-1/2 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Image Gallery and Comments */}
          <div className="space-y-8 sm:col-span-12 xl:col-span-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4"
                >
                  <div className="bg-secondary-bg mb-2 h-4 w-3/4 animate-pulse rounded"></div>
                  <div className="bg-secondary-bg mb-2 h-4 w-1/2 animate-pulse rounded"></div>
                  <div className="bg-secondary-bg aspect-video animate-pulse rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="border-border-primary bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
              <div className="bg-secondary-bg mb-4 h-4 w-1/3 animate-pulse rounded"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="border-border-primary bg-button-secondary h-10 w-10 animate-pulse rounded-full border"></div>
                    <div className="flex-1">
                      <div className="bg-secondary-bg mb-2 h-4 w-1/4 animate-pulse rounded"></div>
                      <div className="bg-secondary-bg h-4 w-full animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
