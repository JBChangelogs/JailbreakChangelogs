import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#2E3944] py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: '#212A31' }} />
          <Skeleton variant="rounded" width={120} height={24} sx={{ bgcolor: '#212A31' }} />
        </div>

        {/* Header section skeleton */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Image/Video skeleton */}
          <div className="flex-shrink-0">
            <Skeleton variant="rounded" width={320} height={180} sx={{ bgcolor: '#37424D' }} />
          </div>
          {/* Main info skeleton */}
          <div className="flex-1 space-y-4">
            <Skeleton variant="text" width={220} height={40} sx={{ bgcolor: '#37424D' }} />
            <Skeleton variant="text" width={120} height={28} sx={{ bgcolor: '#37424D' }} />
            <Skeleton variant="text" width={180} height={24} sx={{ bgcolor: '#37424D' }} />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rounded" width={60} height={28} sx={{ bgcolor: '#37424D' }} />
              ))}
            </div>
            <Skeleton variant="text" width={160} height={20} sx={{ bgcolor: '#37424D' }} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={100} height={32} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
          {/* Tab content skeleton */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="text" width="100%" height={20} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
        </div>

        {/* Similar items skeleton */}
        <div className="mb-8">
          <Skeleton variant="text" width={180} height={28} sx={{ bgcolor: '#37424D' }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={150} height={90} sx={{ bgcolor: '#37424D' }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 