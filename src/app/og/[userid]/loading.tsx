import Breadcrumb from "@/components/Layout/Breadcrumb";
import OGFinderClient from "@/components/OG/OGFinderClient";
import OGFinderDescription from "@/components/OG/OGFinderDescription";
import ExperimentalFeatureBanner from "@/components/ui/ExperimentalFeatureBanner";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <ExperimentalFeatureBanner className="mb-6" />
      <OGFinderDescription />
      <OGFinderClient isLoading={true} />
    </div>
  );
}
