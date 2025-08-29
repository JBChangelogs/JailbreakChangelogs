import Breadcrumb from '@/components/Layout/Breadcrumb';
import ChangelogHeader from '@/components/Changelogs/ChangelogHeader';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#2E3944]">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb loading={true} />
        <ChangelogHeader />
        
        {/* Navigation skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
            <div className="h-12 bg-[#37424D] rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          {/* Content Section - 8/12 columns on desktop, full width on tablet and mobile */}
          <div className="sm:col-span-12 xl:col-span-8">
            <div className="h-8 bg-[#37424D] rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="h-4 bg-[#37424D] rounded w-full mb-4 animate-pulse"></div>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                  <div className="h-4 bg-[#37424D] rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-[#37424D] rounded w-3/4 animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="h-6 bg-[#37424D] rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="h-4 bg-[#37424D] rounded w-1/3 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-4 w-16 bg-[#37424D] rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-[#37424D] rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-[#37424D] rounded w-1/2 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Image Gallery and Comments */}
          <div className="sm:col-span-12 xl:col-span-4 space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
                  <div className="h-4 bg-[#37424D] rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-[#37424D] rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="aspect-video bg-[#37424D] rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-[#2E3944] bg-[#37424D] p-4">
              <div className="h-4 bg-[#37424D] rounded w-1/3 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-10 w-10 rounded-full bg-[#37424D] animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#37424D] rounded w-1/4 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-[#37424D] rounded w-full animate-pulse"></div>
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
