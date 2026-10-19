import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb loading={true} />

        <section className="border-border-card mb-8 border-b pb-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row">
            <div className="bg-secondary-bg h-10 w-full animate-pulse rounded-lg sm:flex-1" />
            <div className="bg-secondary-bg h-10 w-full animate-pulse rounded-lg sm:w-72" />
          </div>
          <div className="space-y-2">
            <div className="bg-secondary-bg h-4 w-32 animate-pulse rounded" />
            <div className="bg-secondary-bg h-8 w-96 max-w-full animate-pulse rounded" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="bg-secondary-bg h-8 w-32 animate-pulse rounded-lg" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-8">
            {[90, 75, 85, 60, 80, 70].map((w) => (
              <div key={w} className="flex items-center gap-2">
                <div className="bg-secondary-bg h-5 w-5 animate-pulse rounded-full" />
                <div
                  className="bg-secondary-bg h-5 animate-pulse rounded"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-8 xl:col-span-4">
            <div className="bg-secondary-bg aspect-video animate-pulse rounded-lg" />
            <div className="bg-secondary-bg h-14 animate-pulse rounded-lg" />
            <div className="border-border-card bg-secondary-bg rounded-lg border p-4">
              <div className="bg-tertiary-bg mb-4 h-4 w-1/3 animate-pulse rounded" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="bg-tertiary-bg h-10 w-10 animate-pulse rounded-full" />
                    <div className="flex-1">
                      <div className="bg-tertiary-bg mb-2 h-4 w-1/4 animate-pulse rounded" />
                      <div className="bg-tertiary-bg h-4 w-full animate-pulse rounded" />
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
