import OGFinderClient from "@/components/OG/OGFinderClient";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import OGFinderFAQ from "@/components/OG/OGFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import ConnectedBotsPolling from "@/components/UI/ConnectedBotsPolling";
import OfficialBotsSection from "@/components/UI/OfficialBotsSection";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { Suspense } from "react";
import { fetchItemCountStats, fetchDuplicatesCount } from "@/utils/api";
import { checkOGFinderMaintenanceMode } from "@/utils/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";

export const dynamic = "force-dynamic";

export default async function OGFinderPage() {
  // Check for OG Finder maintenance mode
  const { isOGFinderMaintenanceMode } = await checkOGFinderMaintenanceMode();
  if (isOGFinderMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="OG Finder"
        customMessage="We're performing infrastructure upgrades. The OG Finder is temporarily unavailable while we perform maintenance. We'll be back soon! 🚀"
      />
    );
  }

  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled("OG_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      <ExperimentalFeatureBanner className="mb-6" />

      <OGFinderDescription />

      <OGFinderClient />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <ConnectedBotsPolling />

      <OfficialBotsSection />

      <OGFinderFAQ />
    </div>
  );
}

// Skeleton loader for stats section
function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="bg-button-secondary mb-2 h-8 animate-pulse rounded"></div>
        <div className="bg-button-secondary h-4 w-24 animate-pulse rounded"></div>
      </div>
    </div>
  );
}

// Component for stats that loads immediately
async function StatsSection() {
  const stats = await fetchItemCountStats();
  const duplicatesStats = await fetchDuplicatesCount();

  if (!stats) {
    return null;
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {stats.item_count_str}
        </div>
        <div className="text-secondary-text text-sm">Items Tracked</div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {stats.user_count_str}
        </div>
        <div className="text-secondary-text text-sm">Users Scanned</div>
      </div>
      <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="text-primary-text text-2xl font-bold">
          {duplicatesStats.total_duplicates_str}
        </div>
        <div className="text-secondary-text text-sm">Total Duplicates</div>
      </div>
    </div>
  );
}
