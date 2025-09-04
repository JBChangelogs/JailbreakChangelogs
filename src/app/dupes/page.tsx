import DupeFinderClient from '@/components/Dupes/DupeFinderClient';
import Breadcrumb from '@/components/Layout/Breadcrumb';
import ExperimentalFeatureBanner from '@/components/UI/ExperimentalFeatureBanner';
import ComingSoon from '@/components/UI/ComingSoon';
import { isFeatureEnabled } from '@/utils/featureFlags';

export const dynamic = 'force-dynamic';

export default function DupeFinderPage() {
  // Check if Dupe Finder feature is enabled
  if (!isFeatureEnabled('DUPE_FINDER')) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Dupe Finder</h1>
        <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
      </div>
      
      <ExperimentalFeatureBanner className="mb-6" />
      
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Enter a Roblox ID or username to check for any duped items associated with that name.
      </p>
      
      <DupeFinderClient />
    </div>
  );
}
