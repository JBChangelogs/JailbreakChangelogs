import Breadcrumb from '@/components/Layout/Breadcrumb';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#2E3944] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb loading={true} />
          
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 bg-[#37424D] rounded w-64 animate-pulse"></div>
              <div className="h-5 w-12 bg-[#5865F2] rounded animate-pulse"></div>
            </div>
            <div className="h-6 bg-[#37424D] rounded w-96 animate-pulse"></div>
          </div>

          {/* Crew Leaderboard skeleton */}
          <div className="mt-8">
            <div className="h-6 bg-[#37424D] rounded w-48 mb-4 animate-pulse"></div>
            <div className="bg-[#212A31] rounded-lg p-4 shadow-sm border border-[#2E3944]">
              <div className="max-h-[48rem] overflow-y-auto space-y-3 pr-2">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[#2E3944] border border-[#37424D] animate-pulse">
                    <div className="w-8 h-8 bg-[#37424D] rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#37424D] rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-[#37424D] rounded w-1/2"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-[#37424D] rounded w-16 mb-1"></div>
                      <div className="h-3 bg-[#37424D] rounded w-12"></div>
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
