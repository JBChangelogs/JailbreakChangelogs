import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  const teams = ["Criminal", "Police"] as const;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pb-16">
        <Breadcrumb loading />
        <div className="space-y-12">
          <div>
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="bg-quaternary-bg/70 h-9 w-72 animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 h-6 w-56 animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 h-5 w-full animate-pulse rounded" />
              <div className="bg-quaternary-bg/70 h-8 w-40 animate-pulse rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="border-border-card bg-tertiary-bg h-48 animate-pulse rounded-xl border p-4" />
              <div className="border-border-card bg-tertiary-bg h-48 animate-pulse rounded-xl border p-4" />
            </div>
          </div>

          {teams.map((team) => (
            <div key={team} className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="border-border-card bg-secondary-bg rounded-2xl border px-8 py-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="bg-quaternary-bg/70 h-8 w-8 animate-pulse rounded-full sm:h-10 sm:w-10" />
                      <div className="bg-quaternary-bg/70 h-8 w-56 animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`${team}-${i}`}
                    className="border-border-card bg-secondary-bg relative flex flex-col overflow-hidden rounded-2xl border"
                  >
                    <div className="px-4 py-3">
                      <div className="bg-quaternary-bg/70 h-8 w-40 animate-pulse rounded" />
                    </div>

                    <div className="relative flex flex-1 flex-col px-4 py-6">
                      <div className="flex h-full flex-col">
                        <div className="mb-4 flex flex-1 items-center justify-center">
                          <div className="space-y-2 text-center">
                            <div className="bg-quaternary-bg/70 h-6 w-52 animate-pulse rounded" />
                            <div className="bg-quaternary-bg/70 mx-auto h-6 w-44 animate-pulse rounded" />
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="border-border-card bg-tertiary-bg rounded-xl border px-4 py-3">
                            <div className="bg-quaternary-bg/70 h-8 w-full animate-pulse rounded" />
                          </div>
                        </div>
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
