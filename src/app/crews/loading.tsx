import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2E3944] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Breadcrumb loading={true} />

          {/* Header skeleton */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-64 animate-pulse rounded bg-[#37424D]"></div>
              <div className="h-5 w-12 animate-pulse rounded bg-[#5865F2]"></div>
            </div>
            <div className="h-6 w-96 animate-pulse rounded bg-[#37424D]"></div>
          </div>

          {/* Crew Leaderboard skeleton */}
          <div className="mt-8">
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-[#37424D]"></div>
            <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
              <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex animate-pulse items-center gap-3 rounded-lg border border-[#37424D] bg-[#2E3944] p-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#37424D]"></div>
                    <div className="flex-1">
                      <div className="mb-2 h-4 w-3/4 rounded bg-[#37424D]"></div>
                      <div className="h-3 w-1/2 rounded bg-[#37424D]"></div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 h-4 w-16 rounded bg-[#37424D]"></div>
                      <div className="h-3 w-12 rounded bg-[#37424D]"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
