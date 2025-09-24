import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import ConnectedBotsPolling from "@/components/UI/ConnectedBotsPolling";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { Suspense } from "react";
import { fetchItemCountStats, fetchDuplicatesCount } from "@/utils/api";

export const dynamic = "force-dynamic";

export default function DupeFinderPage() {
  // Check if Dupe Finder feature is enabled
  if (!isFeatureEnabled("DUPE_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">Dupe Finder</h1>
        <span className="bg-button-info text-form-button-text rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
          New
        </span>
      </div>

      <ExperimentalFeatureBanner className="mb-6" />

      <p className="text-secondary-text mb-4">
        Enter a Roblox ID or username to check for any duped items associated
        with that name.
      </p>

      <DupeFinderClient />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <ConnectedBotsPolling />

      <DupeFinderFAQ />
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
