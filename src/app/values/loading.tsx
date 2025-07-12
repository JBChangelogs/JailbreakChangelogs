import { Skeleton } from '@mui/material';
import ItemCardSkeleton from '@/components/Items/ItemCardSkeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#2E3944] mb-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb skeleton */}
        <div className="py-4">
          <div className="flex items-center">
            <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#212A31' }} />
            <span className="mx-2 text-muted">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <Skeleton variant="rounded" width={120} height={24} sx={{ bgcolor: '#212A31' }} />
          </div>
        </div>

        {/* Header skeleton */}
        <div className="mb-8 rounded-lg border border-[#2E3944] bg-[#212A31] p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton variant="text" width={300} height={36} sx={{ bgcolor: '#37424D' }} />
          </div>
          <Skeleton variant="text" width="100%" height={20} sx={{ bgcolor: '#37424D' }} />
          <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: '#37424D' }} />
        </div>

        {/* Category icons skeleton */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={80} height={40} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
        </div>

        {/* Trader notes skeleton */}
        <div className="mb-8">
          <Skeleton variant="text" width={200} height={28} sx={{ bgcolor: '#37424D' }} />
          <div className="mb-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="text" width="100%" height={16} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
          <Skeleton variant="text" width={250} height={28} sx={{ bgcolor: '#37424D' }} />
          <div className="mb-4 flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={100} height={32} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
          <Skeleton variant="text" width="100%" height={16} sx={{ bgcolor: '#37424D' }} />
        </div>

        {/* Search and filter skeleton */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-4">
              <Skeleton variant="rounded" width="100%" height={40} sx={{ bgcolor: '#37424D' }} />
              <Skeleton variant="rounded" width="100%" height={40} sx={{ bgcolor: '#37424D' }} />
              <Skeleton variant="rounded" width="100%" height={40} sx={{ bgcolor: '#37424D' }} />
            </div>
            <div className="w-full max-w-[480px] lg:w-[480px] lg:flex-shrink-0">
              <Skeleton variant="rounded" width="100%" height={250} sx={{ bgcolor: '#37424D' }} />
            </div>
          </div>
        </div>

        {/* Results count skeleton */}
        <div className="mb-4">
          <Skeleton variant="text" width={200} height={20} sx={{ bgcolor: '#37424D' }} />
        </div>

        {/* Items grid skeleton */}
        <div className="grid grid-cols-1 gap-4 min-[375px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {[...Array(24)].map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="flex justify-center mt-8">
          <Skeleton variant="rounded" width={300} height={40} sx={{ bgcolor: '#37424D' }} />
        </div>
      </div>
    </main>
  );
} 