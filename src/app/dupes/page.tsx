import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import ConnectedBotsPolling from "@/components/UI/ConnectedBotsPolling";
import OfficialBotsSection from "@/components/UI/OfficialBotsSection";
import StatsPolling, { StatsSkeleton } from "@/components/UI/StatsPolling";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { checkDupeFinderMaintenanceMode } from "@/utils/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function DupeFinderPage() {
  // Check for Dupe Finder maintenance mode
  const { isDupeFinderMaintenanceMode } =
    await checkDupeFinderMaintenanceMode();
  if (isDupeFinderMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="Dupe Finder"
        customMessage="We're performing infrastructure upgrades. The Dupe Finder is temporarily unavailable while we perform maintenance. We'll be back soon! 🚀"
      />
    );
  }

  // Check if Dupe Finder feature is enabled
  if (!isFeatureEnabled("DUPE_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">Dupe Finder</h1>
      </div>

      <ExperimentalFeatureBanner className="mb-6" />

      <p className="text-secondary-text mb-4">
        Enter a Roblox ID or username to check for any duped items associated
        with that name.
      </p>

      <DupeFinderClient />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsPolling />
      </Suspense>

      <ConnectedBotsPolling />

      <OfficialBotsSection />

      <DupeFinderFAQ />
    </div>
  );
}
