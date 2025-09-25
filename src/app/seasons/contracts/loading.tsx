export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-secondary-bg mb-6 h-6 w-40 rounded" />
        <div className="bg-secondary-bg mb-2 h-10 w-72 rounded" />
        <div className="bg-secondary-bg mb-8 h-5 w-96 rounded" />
        {/* Criminal Contracts Skeleton */}
        <div className="space-y-6">
          {/* Team Header */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="bg-button-info absolute inset-0 rounded-2xl opacity-30 blur-lg"></div>
              <div className="from-button-info to-button-info-hover relative rounded-2xl bg-gradient-to-r px-8 py-4 shadow-2xl">
                <div className="flex items-center justify-center gap-4"></div>
              </div>
            </div>
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="group hover:shadow-3xl border-border-primary hover:border-border-focus relative flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {/* Contract Header */}
                <div className="bg-secondary-bg px-4 py-3"></div>

                {/* Contract Body */}
                <div className="bg-secondary-bg relative flex flex-1 flex-col px-4 py-6">
                  <div className="relative z-10 flex h-full flex-col">
                    {/* Task Description */}
                    <div className="mb-4 flex flex-1 items-center justify-center">
                      <div className="text-center"></div>
                    </div>

                    {/* Reward Section */}
                    <div className="mt-auto">
                      <div className="relative">
                        <div className="bg-primary-bg absolute inset-0 rounded-xl opacity-50 blur-sm"></div>
                        <div className="border-border-primary hover:border-border-focus bg-primary-bg relative rounded-xl border px-4 py-3 shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Police Contracts Skeleton */}
        <div className="mt-12 space-y-6">
          {/* Team Header */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="bg-button-info absolute inset-0 rounded-2xl opacity-30 blur-lg"></div>
              <div className="from-button-info to-button-info-hover relative rounded-2xl bg-gradient-to-r px-8 py-4 shadow-2xl">
                <div className="flex items-center justify-center gap-4"></div>
              </div>
            </div>
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i + 3}
                className="group hover:shadow-3xl border-border-primary hover:border-border-focus relative flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {/* Contract Header */}
                <div className="bg-secondary-bg px-4 py-3"></div>

                {/* Contract Body */}
                <div className="bg-secondary-bg relative flex flex-1 flex-col px-4 py-6">
                  <div className="relative z-10 flex h-full flex-col">
                    {/* Task Description */}
                    <div className="mb-4 flex flex-1 items-center justify-center">
                      <div className="text-center"></div>
                    </div>

                    {/* Reward Section */}
                    <div className="mt-auto">
                      <div className="relative">
                        <div className="bg-primary-bg absolute inset-0 rounded-xl opacity-50 blur-sm"></div>
                        <div className="border-border-primary hover:border-border-focus bg-primary-bg relative rounded-xl border px-4 py-3 shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
