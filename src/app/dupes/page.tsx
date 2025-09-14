import DupeFinderClient from "@/components/Dupes/DupeFinderClient";
import DupeConfetti from "@/components/Dupes/DupeConfetti";
import DupeFinderFAQ from "@/components/Dupes/DupeFinderFAQ";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";

export const dynamic = "force-dynamic";

export default function DupeFinderPage() {
  // Check if Dupe Finder feature is enabled
  if (!isFeatureEnabled("DUPE_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DupeConfetti />
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white">Dupe Finder</h1>
        <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
          New
        </span>
      </div>

      <ExperimentalFeatureBanner className="mb-6" />

      <p className="mb-4 text-white">
        Enter a Roblox ID or username to check for any duped items associated
        with that name.
      </p>

      <DupeFinderClient />

      <DupeFinderFAQ />
    </div>
  );
}
