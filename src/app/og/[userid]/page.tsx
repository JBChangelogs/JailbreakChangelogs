import OGFinderDataStreamer from "@/components/OG/OGFinderDataStreamer";
import OGFinderClient from "@/components/OG/OGFinderClient";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Suspense } from "react";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import { isFeatureEnabled } from "@/utils/api/featureFlags";
import { checkOGFinderMaintenanceMode } from "@/utils/api/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";

export const dynamic = "force-dynamic";

interface OGFinderUserPageProps {
  params: Promise<{
    userid: string;
  }>;
}

import NitroOGDetailRailAd from "@/components/Ads/NitroOGDetailRailAd";
import NitroOGDetailRightRailAd from "@/components/Ads/NitroOGDetailRightRailAd";

export default async function OGFinderUserPage({
  params,
}: OGFinderUserPageProps) {
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

  const { userid } = await params;

  return (
    <>
      <NitroOGDetailRailAd />
      <NitroOGDetailRightRailAd />
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        <OGFinderDescription />

        <PremiumAwareLayout>
          <Suspense
            fallback={<OGFinderClient isLoading={true} robloxId={userid} />}
          >
            <OGFinderDataStreamer robloxId={userid} />
          </Suspense>
        </PremiumAwareLayout>
      </div>
    </>
  );
}
