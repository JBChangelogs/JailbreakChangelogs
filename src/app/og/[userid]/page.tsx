import OGFinderDataStreamer from '@/components/OG/OGFinderDataStreamer';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import ProtectedOGWrapper from '@/components/OG/ProtectedOGWrapper';
import { Suspense } from 'react';
import ExperimentalFeatureBanner from '@/components/UI/ExperimentalFeatureBanner';
import ComingSoon from '@/components/UI/ComingSoon';
import { isFeatureEnabled } from '@/utils/featureFlags';

export const dynamic = 'force-dynamic';

interface OGFinderUserPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function OGFinderUserPage({ params }: OGFinderUserPageProps) {
  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled('OG_FINDER')) {
    return <ComingSoon />;
  }

  const { userid } = await params;

  return (
    <ProtectedOGWrapper>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold">OG Finder</h1>
          <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
        </div>
        
        <ExperimentalFeatureBanner className="mb-6" />
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter a Roblox ID or username to find items that were originally owned by them.
        </p>
        
        <Suspense fallback={
          <div className="bg-[#212A31] rounded-lg p-6 shadow-sm border border-[#2E3944]">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-600 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-[#2E3944] rounded-lg">
                    <div className="w-12 h-12 bg-gray-600 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-48"></div>
                      <div className="h-3 bg-gray-600 rounded w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          <OGFinderDataStreamer robloxId={userid} />
        </Suspense>
      </div>
    </ProtectedOGWrapper>
  );
}
