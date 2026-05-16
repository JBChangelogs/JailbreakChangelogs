import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto min-h-screen max-w-7xl py-8">
      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:col-span-3 lg:block">
          <div className="bg-secondary-bg border-border-primary rounded-2xl border p-4">
            <Skeleton
              style={{ width: "60%", height: 32 }}
              className="mx-2 mb-2"
            />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-2 py-[0.375rem]">
                <Skeleton
                  className="rounded-none"
                  style={{ width: "100%", height: 36 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="col-span-12 lg:col-span-9">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-border-primary bg-secondary-bg mb-8 rounded-2xl border p-6"
            >
              <div className="mb-6 flex items-center gap-2">
                <Skeleton
                  className="rounded-full"
                  style={{ width: 32, height: 32 }}
                />
                <Skeleton style={{ width: "40%", height: 40 }} />
              </div>

              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <Skeleton
                      style={{ width: "30%", height: 28 }}
                      className="mb-1"
                    />
                    <Skeleton
                      style={{ width: "80%", height: 20 }}
                      className="mb-2"
                    />
                    <Skeleton
                      className="rounded-none"
                      style={{ width: 44, height: 24 }}
                    />
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
