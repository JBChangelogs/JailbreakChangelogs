import NitroRailFallbackAd from "@/components/Ads/NitroRailFallbackAd";

import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import MostDuplicatedItemsServer from "@/components/Dupes/MostDuplicatedItemsServer";
import MostDuplicatedItemsSkeleton from "@/components/Dupes/MostDuplicatedItemsSkeleton";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ConnectedBotsPolling from "@/components/ui/ConnectedBotsPolling";
import StatsPolling, { StatsSkeleton } from "@/components/ui/StatsPolling";
import { checkDupeFinderMaintenanceMode } from "@/utils/api/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import { Suspense } from "react";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import RelatedInventoryPages from "@/components/Inventory/RelatedInventoryPages";

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

  return (
    <>
      <NitroRailAd
        adIdSmall="np-rail-left-dupes"
        adIdWide="np-rail-left-dupes-wide"
      />
      <NitroRailAd
        adIdSmall="np-rail-right-dupes"
        adIdWide="np-rail-right-dupes-wide"
        side="right"
      />
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
          <h1 className="page-heading">Dupe Finder</h1>
        </div>

        <p className="text-secondary-text mb-3">
          Enter a username or Roblox ID to check whether a Jailbreak item is
          duped.
        </p>
        <div className="mb-6">
          <RelatedInventoryPages current="dupes" />
        </div>

        <NitroRailFallbackAd adId="np-rail-left-dupes-fallback" />

        <PremiumAwareLayout>
          <DupeFinderClient />

          <Suspense fallback={<StatsSkeleton />}>
            <StatsPolling />
          </Suspense>

          <Suspense fallback={<MostDuplicatedItemsSkeleton />}>
            <MostDuplicatedItemsServer />
          </Suspense>

          <ConnectedBotsPolling />

          <DupeFinderFAQ />
        </PremiumAwareLayout>
      </div>
    </>
  );
}
