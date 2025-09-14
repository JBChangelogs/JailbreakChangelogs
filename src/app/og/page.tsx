import OGFinderClient from "@/components/OG/OGFinderClient";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import OGFinderFAQ from "@/components/OG/OGFinderFAQ";
import OGConfetti from "@/components/OG/OGConfetti";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ExperimentalFeatureBanner from "@/components/UI/ExperimentalFeatureBanner";
import ComingSoon from "@/components/UI/ComingSoon";
import { isFeatureEnabled } from "@/utils/featureFlags";

export const dynamic = "force-dynamic";

export default function OGFinderPage() {
  // Check if OG Finder feature is enabled
  if (!isFeatureEnabled("OG_FINDER")) {
    return <ComingSoon />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <OGConfetti />

      <Breadcrumb />

      <ExperimentalFeatureBanner className="mb-6" />

      <OGFinderDescription />

      <OGFinderClient />

      <OGFinderFAQ />
    </div>
  );
}
