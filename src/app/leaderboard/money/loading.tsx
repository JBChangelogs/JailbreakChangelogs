import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function MoneyLeaderboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />

      <div className="mb-8">
        <div className="h-9 w-64 animate-pulse rounded bg-[#2E3944]" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded bg-[#2E3944]" />
      </div>

      <div className="mt-8">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-[#2E3944]" />
        <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
          <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-2">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-[#2E3944] bg-[#2E3944] p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#374151]" />
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[#374151]" />
                  <div className="flex flex-col space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-[#374151]" />
                    <div className="h-3 w-24 animate-pulse rounded bg-[#374151]" />
                  </div>
                </div>
                <div className="h-6 w-24 animate-pulse rounded bg-[#374151]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
