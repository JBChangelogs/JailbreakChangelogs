import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import MostDuplicatedItems from "@/components/Dupes/MostDuplicatedItems";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import ConnectedBotsPolling from "@/components/ui/ConnectedBotsPolling";
import OfficialBotsSection from "@/components/ui/OfficialBotsSection";
import StatsPolling, { StatsSkeleton } from "@/components/ui/StatsPolling";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { checkDupeFinderMaintenanceMode } from "@/utils/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import { Suspense } from "react";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";
import { fetchMostDuplicatedItems } from "@/utils/api";
import NitroLiveScansAd from "@/components/Ads/NitroLiveScansAd";
import NitroDupesRailAd from "@/components/Ads/NitroDupesRailAd";

export const dynamic = "force-dynamic";

export default async function DupeFinderPage() {
  // Check for Dupe Finder maintenance mode
  const { isDupeFinderMaintenanceMode } =
    await checkDupeFinderMaintenanceMode();
  if (isDupeFinderMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="Dupe Finder"
        customMessage="We're experiencing technical difficulties. The Dupe Finder is temporarily unavailable. Please try again later."
      />
    );
  }

  // Check if Dupe Finder feature is enabled
  if (!isFeatureEnabled("DUPE_FINDER")) {
    return <ComingSoon />;
  }

  // Fetch most duplicated items
  const mostDuplicatedItems = await fetchMostDuplicatedItems();

  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />

      <ExperimentalFeatureBanner className="mb-6" />

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">Dupe Finder</h1>
      </div>

      <p className="text-secondary-text mb-4">
        Enter a Roblox ID or username to check for any duped items associated
        with that name.
      </p>

      <PremiumAwareLayout>
        <DupeFinderClient />

        <NitroDupesRailAd />
        <Suspense fallback={<StatsSkeleton />}>
          <StatsPolling />
        </Suspense>

        <MostDuplicatedItems items={mostDuplicatedItems} />
        <NitroLiveScansAd />

        <ConnectedBotsPolling />

        <OfficialBotsSection />

        <DupeFinderFAQ />
      </PremiumAwareLayout>
    </div>
  );
}
