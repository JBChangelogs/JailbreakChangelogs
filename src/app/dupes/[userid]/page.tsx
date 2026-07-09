import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import DupeFinderDataStreamer from "@/components/Dupes/DupeFinderDataStreamer";
import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import ComingSoon from "@/components/ui/ComingSoon";
import { isFeatureEnabled } from "@/utils/api/featureFlags";
import { checkDupeFinderMaintenanceMode } from "@/utils/api/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";

export const dynamic = "force-dynamic";

interface DupeFinderPageProps {
  params: Promise<{
    userid: string;
  }>;
}

import NitroDupeDetailRailAd from "@/components/Ads/NitroDupeDetailRailAd";
import NitroDupeDetailRightRailAd from "@/components/Ads/NitroDupeDetailRightRailAd";

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
    <>
      <NitroDupeDetailRailAd />
      <NitroDupeDetailRightRailAd />
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
        <div className="bg-button-info/10 border-border-card text-primary-text mb-6 rounded-lg border p-4 text-sm">
          If you believe an item is incorrectly flagged, you can report the
          false dupe by opening a ticket in our{" "}
          <Link
            href="https://discord.jailbreakchangelogs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-text inline-flex items-center gap-1 font-semibold underline transition-opacity hover:opacity-80"
          >
            <Icon icon="akar-icons:link-out" className="h-4 w-4" />
            Discord support channel
          </Link>
          .
        </div>

        <PremiumAwareLayout>
          <Suspense
            fallback={
              <DupeFinderClient isLoading={true} originalSearchTerm={userid} />
            }
          >
            <DupeFinderDataStreamer robloxId={userid} />
          </Suspense>

          <DupeFinderFAQ />
        </PremiumAwareLayout>
      </div>
    </>
  );
}
