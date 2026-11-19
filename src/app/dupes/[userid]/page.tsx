import { notFound } from "next/navigation";
import DupeFinderDataStreamer from "@/components/Dupes/DupeFinderDataStreamer";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";
import { checkDupeFinderMaintenanceMode } from "@/utils/api/maintenance";
import FeatureMaintenance from "@/theme/FeatureMaintenance";
import PremiumAwareLayout from "@/components/Layout/PremiumAwareLayout";
import NitroRailAd from "@/components/Ads/NitroRailAd";
import NitroInlineVideoPlayer from "@/components/Ads/NitroInlineVideoPlayer";
import RelatedInventoryPages from "@/components/Inventory/RelatedInventoryPages";

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

  const { userid } = await params;

  // Allow both usernames and numeric IDs
  // The inventory API accepts usernames directly
  const isNumeric = /^\d+$/.test(userid);
  const robloxId = parseInt(userid);

  // Only validate numeric IDs, allow usernames to pass through
  if (isNumeric && (isNaN(robloxId) || robloxId <= 0)) {
    notFound();
  }

  return (
    <>
      <NitroRailAd
        adIdSmall="np-rail-left-dupe-detail"
        adIdWide="np-rail-left-dupe-detail-wide"
      />
      <NitroRailAd
        adIdSmall="np-rail-right-dupe-detail"
        adIdWide="np-rail-right-dupe-detail-wide"
        side="right"
      />
      <div className="container mx-auto px-4 pb-8">
        <Breadcrumb />

        <ExperimentalFeatureBanner className="mb-6" />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="page-heading">Dupe Finder</h1>
            </div>
            <p className="text-secondary-text mb-3">
              Enter a username or Roblox ID to check whether a Jailbreak item is
              duped.
            </p>
            <div>
              <RelatedInventoryPages current="dupes" />
            </div>
          </div>

          <NitroInlineVideoPlayer
            slotId="dupe-detail-header-video"
            className="w-full self-center lg:w-96 lg:shrink-0"
          />
        </div>
        <div className="bg-button-info/10 border-button-info text-primary-text mb-6 rounded-lg border p-4 text-sm">
          If you believe an item is incorrectly flagged, you can report the
          false dupe after reviewing its ownership histories. Choose
          &quot;Comparison&quot; on the card to open the histories in a new tab,
          or &quot;Dupe check&quot; to run a check and report from its results.
        </div>

        <PremiumAwareLayout>
          <DupeFinderDataStreamer robloxId={userid} />

          <DupeFinderFAQ />
        </PremiumAwareLayout>
      </div>
    </>
  );
}
