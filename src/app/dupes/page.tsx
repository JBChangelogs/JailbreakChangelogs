import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import MostDuplicatedItemsServer from "@/components/Dupes/MostDuplicatedItemsServer";
import MostDuplicatedItemsSkeleton from "@/components/Dupes/MostDuplicatedItemsSkeleton";
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
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import Link from "next/link";

export const dynamic = "force-dynamic";

import NitroDupesRailAd from "@/components/Ads/NitroDupesRailAd";

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

  return (
    <div className="container mx-auto px-4 pb-8">
      <NitroDupesRailAd />
      <Breadcrumb />

      <ExperimentalFeatureBanner className="mb-6" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-primary-text text-3xl font-bold">Dupe Finder</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/values" prefetch={false}>
            <Icon icon="heroicons:list-bullet" className="mr-2" />
            Values List
          </Link>
        </Button>
      </div>

      <p className="text-secondary-text mb-4">
        Enter a Roblox ID or username to check for any duped items associated
        with that name.
      </p>

      <PremiumAwareLayout>
        <DupeFinderClient />

        <Suspense fallback={<StatsSkeleton />}>
          <StatsPolling />
        </Suspense>

        <Suspense fallback={<MostDuplicatedItemsSkeleton />}>
          <MostDuplicatedItemsServer />
        </Suspense>

        <ConnectedBotsPolling />

        <OfficialBotsSection />

        <DupeFinderFAQ />
      </PremiumAwareLayout>
    </div>
  );
}
