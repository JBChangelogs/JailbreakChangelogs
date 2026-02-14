import InventoryCheckerClient from "./InventoryCheckerClient";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { fetchUserScansLeaderboard, UserScan } from "@/utils/api";
import { Suspense } from "react";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import ConnectedBotsPolling from "@/components/ui/ConnectedBotsPolling";
import OfficialBotsSection from "@/components/ui/OfficialBotsSection";
import StatsPolling, { StatsSkeleton } from "@/components/ui/StatsPolling";
import { isFeatureEnabled } from "@/utils/featureFlags";
import ScanOptionSection from "@/components/Inventory/ScanOptionSection";
import { checkInventoryMaintenanceMode } from "@/utils/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import MostScannedLeaderboardClient from "@/components/Inventory/MostScannedLeaderboardClient";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";

export const dynamic = "force-dynamic";

import NitroInventoriesRailAd from "@/components/Ads/NitroInventoriesRailAd";

export default async function InventoriesPage() {
  // Check for inventory maintenance mode
  const { isInventoryMaintenanceMode } = await checkInventoryMaintenanceMode();
  if (isInventoryMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="Inventory Checker"
        customMessage="We're experiencing technical difficulties. The Inventory Checker is temporarily unavailable. Please try again later."
      />
    );
  }

  if (!isFeatureEnabled("INVENTORY_CALCULATOR")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <NitroInventoriesRailAd />
      <Breadcrumb />

      <ExperimentalFeatureBanner className="mb-6" />

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-primary-text text-3xl font-bold">
          Inventory Checker
        </h1>
      </div>

      <p className="text-primary-text mb-4">
        Enter a username or Roblox ID to check their Jailbreak inventory, or use
        the option below to view your own inventory.
      </p>

      {/* Want on-demand scans section */}
      <ScanOptionSection variant="main" />

      <PremiumAwareLayout>
        <InventoryCheckerClient key="inventories-root" />

        <Suspense fallback={<StatsSkeleton />}>
          <StatsPolling />
        </Suspense>

        <ConnectedBotsPolling />

        <OfficialBotsSection />

        <Suspense fallback={<LeaderboardSkeleton />}>
          <LeaderboardSection />
        </Suspense>
      </PremiumAwareLayout>
    </div>
  );
}

// Skeleton loader for leaderboard section
function LeaderboardSkeleton() {
  return (
    <div className="mt-8">
      <div className="bg-button-secondary mb-4 h-6 w-64 animate-pulse rounded"></div>
      <div className="border-border-card bg-secondary-bg shadow-card-shadow rounded-lg border p-4">
        <div className="max-h-128 space-y-3 overflow-y-auto pr-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-border-card bg-tertiary-bg flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="bg-button-secondary h-8 w-8 animate-pulse rounded-full"></div>
                <div className="bg-button-secondary h-10 w-10 animate-pulse rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="bg-button-secondary mb-1 h-4 w-32 animate-pulse rounded"></div>
                <div className="bg-button-secondary h-3 w-24 animate-pulse rounded"></div>
              </div>
              <div className="bg-button-secondary h-6 w-16 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Component for leaderboard section
async function LeaderboardSection() {
  let leaderboard: UserScan[] = [];

  try {
    leaderboard = await fetchUserScansLeaderboard();
  } catch (error) {
    console.error("[SERVER] Error in LeaderboardSection:", error);
    leaderboard = [];
  }

  return <MostScannedLeaderboardClient initialLeaderboard={leaderboard} />;
}
