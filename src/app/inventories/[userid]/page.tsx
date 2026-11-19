import { notFound } from "next/navigation";
import InventoryDataLoader from "../InventoryDataLoader";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import { checkInventoryMaintenanceMode } from "@/utils/api/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import RelatedInventoryPages from "@/components/Inventory/RelatedInventoryPages";

export const dynamic = "force-dynamic";

interface InventoryCheckerPageProps {
  params: Promise<{
    userid: string;
  }>;
}

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

  const { userid } = await params;

  const isNumeric = /^\d+$/.test(userid);
  const robloxId = parseInt(userid);

  if (isNumeric && (isNaN(robloxId) || robloxId <= 0)) {
    notFound();
  }

  return (
    <>
      <NitroRailAd
        adIdSmall="np-inventory-detail-rail"
        adIdWide="np-inventory-detail-rail-wide"
      />
      <NitroRailAd
        adIdSmall="np-inventory-detail-rail-right"
        adIdWide="np-inventory-detail-rail-right-wide"
        side="right"
      />
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="page-heading">Inventory Checker</h1>
            </div>
            <p className="text-secondary-text mb-3">
              Enter a username or Roblox ID to check their Jailbreak inventory.
            </p>
            <div>
              <RelatedInventoryPages current="inventories" />
            </div>
          </div>

          <NitroInlineVideoPlayer
            slotId="inventory-detail-header-video"
            className="w-full self-center lg:w-96 lg:shrink-0"
          />
        </div>

        <PremiumAwareLayout>
          <InventoryDataLoader key={userid} robloxId={userid} />
        </PremiumAwareLayout>
      </div>
    </>
  );
}
