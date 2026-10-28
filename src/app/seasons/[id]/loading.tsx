import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb loading={true} />

        <section className="border-border-card mb-8 border-b pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="bg-quaternary-bg/70 h-4 w-24 animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 h-8 w-64 animate-pulse rounded" />
            </div>
            <div className="bg-quaternary-bg/70 h-10 w-full animate-pulse rounded-lg sm:w-72" />
          </div>
          <div className="bg-quaternary-bg/70 mt-3 h-4 w-72 animate-pulse rounded" />
          <div className="bg-quaternary-bg/70 mt-4 h-16 max-w-3xl animate-pulse rounded" />
          <div className="mt-4 flex gap-2">
            <div className="bg-quaternary-bg/70 h-8 w-32 animate-pulse rounded-lg" />
            <div className="bg-quaternary-bg/70 h-8 w-36 animate-pulse rounded-lg" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="bg-quaternary-bg/70 mb-4 h-7 w-32 animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="border-border-card bg-secondary-bg overflow-hidden rounded-lg border"
                >
                  <div className="bg-quaternary-bg/70 aspect-video animate-pulse" />
                  <div className="space-y-2 p-3">
                    <div className="bg-quaternary-bg/70 h-4 w-2/3 animate-pulse rounded" />
                    <div className="bg-quaternary-bg/70 h-6 w-20 animate-pulse rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 xl:col-span-4">
            <div className="bg-quaternary-bg/70 h-24 animate-pulse rounded-lg" />
            <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
              <div className="bg-quaternary-bg/70 mb-4 h-4 w-1/3 animate-pulse rounded" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="bg-quaternary-bg/70 h-10 w-10 animate-pulse rounded-full" />
                    <div className="flex-1">
                      <div className="bg-quaternary-bg/70 mb-2 h-4 w-1/4 animate-pulse rounded" />
                      <div className="bg-quaternary-bg/70 h-4 w-full animate-pulse rounded" />
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
