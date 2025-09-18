import OGFinderClient from "@/components/OG/OGFinderClient";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import OGFinderFAQ from "@/components/OG/OGFinderFAQ";
import OGConfetti from "@/components/OG/OGConfetti";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import ConnectedBotsPolling from "@/components/UI/ConnectedBotsPolling";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { Suspense } from "react";
import { fetchItemCountStats, fetchDuplicatesCount } from "@/utils/api";

export const dynamic = "force-dynamic";

export default function OGFinderPage() {
  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled("OG_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <OGConfetti />

      <Breadcrumb />

      <ExperimentalFeatureBanner className="mb-6" />

      <OGFinderDescription />

      <OGFinderClient />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <ConnectedBotsPolling />

      <OGFinderFAQ />
    </div>
  );
}

// Skeleton loader for stats section
function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="mb-2 h-8 animate-pulse rounded bg-[#37424D]"></div>
        <div className="h-4 w-24 animate-pulse rounded bg-[#37424D]"></div>
      </div>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="mb-2 h-8 animate-pulse rounded bg-[#37424D]"></div>
        <div className="h-4 w-24 animate-pulse rounded bg-[#37424D]"></div>
      </div>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="mb-2 h-8 animate-pulse rounded bg-[#37424D]"></div>
        <div className="h-4 w-24 animate-pulse rounded bg-[#37424D]"></div>
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
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="text-2xl font-bold text-blue-400">
          {stats.item_count_str}
        </div>
        <div className="text-sm text-gray-400">Items Tracked</div>
      </div>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="text-2xl font-bold text-green-400">
          {stats.user_count_str}
        </div>
        <div className="text-sm text-gray-400">Users Scanned</div>
      </div>
      <div className="rounded-lg border border-[#2E3944] bg-[#212A31] p-4 shadow-sm">
        <div className="text-2xl font-bold text-[#ef4444]">
          {duplicatesStats.total_duplicates_str}
        </div>
        <div className="text-sm text-gray-400">Total Duplicates</div>
      </div>
    </div>
  );
}
