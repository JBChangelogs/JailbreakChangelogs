import { Suspense } from "react";
import { notFound } from "next/navigation";
import DupeFinderDataStreamer from "@/components/Dupes/DupeFinderDataStreamer";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";
import { checkDupeFinderMaintenanceMode } from "@/utils/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";

export const dynamic = "force-dynamic";

interface DupeFinderPageProps {
  params: Promise<{
    userid: string;
  }>;
}

export default async function DupeFinderPage({ params }: DupeFinderPageProps) {
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

  const { userid } = await params;

  // Allow both usernames and numeric IDs
  // Let DupeFinderDataStreamer handle the username resolution
  const isNumeric = /^\d+$/.test(userid);
  const robloxId = parseInt(userid);

  // Only validate numeric IDs, allow usernames to pass through
  if (isNumeric && (isNaN(robloxId) || robloxId <= 0)) {
    notFound();
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
      <Suspense
        fallback={
          <div className="border-border-primary bg-secondary-bg shadow-card-shadow rounded-lg border p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-surface-bg h-16 w-16 rounded-full"></div>
                <div className="flex-1">
                  <div className="bg-surface-bg mb-2 h-6 w-32 rounded"></div>
                  <div className="bg-surface-bg h-4 w-24 rounded"></div>
                </div>
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-lg p-4"
                  >
                    <div className="bg-surface-bg h-12 w-12 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-surface-bg h-4 w-48 rounded"></div>
                      <div className="bg-surface-bg h-3 w-32 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <DupeFinderDataStreamer robloxId={userid} />
      </Suspense>

      <DupeFinderFAQ />
    </div>
  );
}
