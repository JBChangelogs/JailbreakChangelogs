import OGFinderClient from '@/components/OG/OGFinderClient';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import ExperimentalFeatureBanner from '@/components/UI/ExperimentalFeatureBanner';
import ProtectedOGWrapper from '@/components/OG/ProtectedOGWrapper';
import { isFeatureEnabled } from '@/utils/featureFlags';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function OGFinderPage() {
  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled('OG_FINDER')) {
    redirect('/');
  }

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
        
        <OGFinderClient />
      </div>
    </ProtectedOGWrapper>
  );
}
