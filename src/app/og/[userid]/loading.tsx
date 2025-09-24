import Breadcrumb from "@/components/Layout/Breadcrumb";
import OGFinderClient from "@/components/OG/OGFinderClient";

export default function Loading() {
  return (
    <div className="container mx-auto px-4">
      <Breadcrumb />
      <h1 className="mb-6 text-3xl font-bold">OG Finder</h1>
      <OGFinderClient isLoading={true} />
    </div>
  );
}
