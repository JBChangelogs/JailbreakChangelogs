import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeConfetti from "@/components/Dupes/DupeConfetti";
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
    <div className="container mx-auto px-4 py-8">
      <DupeConfetti />
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Dupe Finder</h1>
        <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
          New
        </span>
      </div>

      <ExperimentalFeatureBanner className="mb-6" />

      <p className="mb-4 text-white">
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
