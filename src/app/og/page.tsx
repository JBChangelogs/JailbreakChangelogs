import OGFinderClient from "@/components/OG/OGFinderClient";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import OGFinderFAQ from "@/components/OG/OGFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import ConnectedBotsPolling from "@/components/ui/ConnectedBotsPolling";
import OfficialBotsSection from "@/components/ui/OfficialBotsSection";
import StatsPolling, { StatsSkeleton } from "@/components/ui/StatsPolling";
import { isFeatureEnabled } from "@/utils/config/featureFlags";
import { checkOGFinderMaintenanceMode } from "@/utils/config/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function OGFinderPage() {
  // Check for OG Finder maintenance mode
  const { isOGFinderMaintenanceMode } = await checkOGFinderMaintenanceMode();
  if (isOGFinderMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="OG Finder"
        customMessage="We're experiencing technical difficulties. The OG Finder is temporarily unavailable. Please try again later."
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
        <StatsPolling />
      </Suspense>

      <ConnectedBotsPolling />

      <OfficialBotsSection />

      <OGFinderFAQ />
    </div>
  );
}
