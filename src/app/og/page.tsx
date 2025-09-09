import OGFinderClient from "@/components/OG/OGFinderClient";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ProtectedOGWrapper from "@/components/OG/ProtectedOGWrapper";
import ComingSoon from "@/components/UI/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";

export const dynamic = "force-dynamic";

export default function OGFinderPage() {
  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled("OG_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <ProtectedOGWrapper>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold">OG Finder</h1>
          <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
            New
          </span>
        </div>

        <ExperimentalFeatureBanner className="mb-6" />

        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Enter a Roblox ID or username to find items that were originally owned
          by them.
        </p>

        <OGFinderClient />
      </div>
    </ProtectedOGWrapper>
  );
}
