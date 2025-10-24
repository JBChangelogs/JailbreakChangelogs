import OGFinderDataStreamer from "@/components/OG/OGFinderDataStreamer";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Suspense } from "react";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";
import OGAuthWrapper from "@/components/OG/OGAuthWrapper";
import { checkOGFinderMaintenanceMode } from "@/utils/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";

export const dynamic = "force-dynamic";

interface OGFinderUserPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function OGFinderUserPage({
  params,
}: OGFinderUserPageProps) {
  // Check for OG Finder maintenance mode
  const { isOGFinderMaintenanceMode } = await checkOGFinderMaintenanceMode();
  if (isOGFinderMaintenanceMode) {
    return (
      <FeatureMaintenance
        featureName="OG Finder"
        customMessage="We're performing infrastructure upgrades. The OG Finder is temporarily unavailable while we perform maintenance. We'll be back soon! 🚀"
      />
    );
  }

  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled("OG_FINDER")) {
    return <ComingSoon />;
  }

  const { userid } = await params;

  return (
    <OGAuthWrapper>
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        <OGFinderDescription />

        <Suspense
          fallback={
            <div className="border-border-primary bg-secondary-bg rounded-lg border p-6 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-button-secondary h-16 w-16 rounded-full"></div>
                  <div className="flex-1">
                    <div className="bg-button-secondary mb-2 h-6 w-32 rounded"></div>
                    <div className="bg-button-secondary h-4 w-24 rounded"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-lg p-4"
                    >
                      <div className="bg-button-secondary h-12 w-12 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-button-secondary h-4 w-48 rounded"></div>
                        <div className="bg-button-secondary h-3 w-32 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <OGFinderDataStreamer robloxId={userid} />
        </Suspense>
      </div>
    </OGAuthWrapper>
  );
}
