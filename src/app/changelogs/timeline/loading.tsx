import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto">
        <Breadcrumb loading={true} />

        {/* Timeline Header Skeleton */}
        <div className="border-border-primary hover:border-border-focus bg-secondary-bg mb-8 rounded-lg border p-6">
          <div className="bg-secondary-bg mb-4 h-8 w-80 animate-pulse rounded"></div>
          <div className="bg-secondary-bg mb-4 h-4 w-full animate-pulse rounded"></div>
          <div className="bg-secondary-bg mb-4 h-4 w-3/4 animate-pulse rounded"></div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="bg-secondary-bg h-10 w-32 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Timeline Content Skeleton */}
        <div className="relative">
          {/* Vertical timeline line skeleton */}
          <div className="bg-border-border-primary hover:border-border-focus absolute top-0 bottom-0 left-0 w-1 md:left-1/2 md:-translate-x-1/2"></div>

          <div className="space-y-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={`relative flex ${i % 2 === 0 ? "md:justify-start" : "md:justify-end"}`}
              >
                {/* Connector line skeleton */}
                <div
                  className={`bg-border-border-primary hover:border-border-focus absolute top-1/2 h-0.5 w-1/2 ${i % 2 === 0 ? "left-0" : "right-0"}`}
                ></div>

                {/* Card skeleton */}
                <div
                  className={`relative z-10 ml-8 w-full md:ml-0 md:w-[calc(45%-2rem)]`}
                >
                  <div className="border-border-primary hover:border-border-focus bg-secondary-bg overflow-hidden rounded-lg border">
                    {/* Image skeleton */}
                    <div className="bg-secondary-bg relative aspect-video w-full animate-pulse"></div>

                    {/* Content skeleton */}
                    <div className="p-3">
                      <div className="flex flex-col gap-0.5">
                        {/* Title skeleton */}
                        <div className="bg-secondary-bg h-6 w-3/4 animate-pulse rounded"></div>
                        {/* Subtitle skeleton */}
                        <div className="bg-secondary-bg h-4 w-1/2 animate-pulse rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
