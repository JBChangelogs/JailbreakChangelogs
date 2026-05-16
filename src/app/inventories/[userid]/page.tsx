import { Suspense } from "react";
import { notFound } from "next/navigation";
import InventoryCheckerClient from "../InventoryCheckerClient";
import InventoryDataStreamer from "../InventoryDataStreamer";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import { isFeatureEnabled } from "@/utils/api/featureFlags";
import { checkInventoryMaintenanceMode } from "@/utils/api/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";

export const dynamic = "force-dynamic";

interface InventoryCheckerPageProps {
  params: Promise<{
    userid: string;
  }>;
}

import NitroInventoryDetailRailAd from "@/components/Ads/NitroInventoryDetailRailAd";

export default async function InventoryCheckerPage({
  params,
}: InventoryCheckerPageProps) {
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

  const { userid } = await params;

  const isNumeric = /^\d+$/.test(userid);
  const robloxId = parseInt(userid);

  if (isNumeric && (isNaN(robloxId) || robloxId <= 0)) {
    notFound();
  }

  return (
    <>
      <NitroInventoryDetailRailAd />
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-primary-text text-3xl font-bold">
            Inventory Checker
          </h1>
        </div>

        <PremiumAwareLayout>
          <Suspense
            key={`inventory-detail-${userid}`}
            fallback={
              <InventoryCheckerClient
                key={`inventory-detail-fallback-${userid}`}
                robloxId={userid}
                isLoading={true}
              />
            }
          >
            <InventoryDataStreamer robloxId={userid} />
          </Suspense>
        </PremiumAwareLayout>
      </div>
    </>
  );
}
