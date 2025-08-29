import Breadcrumb from '@/components/Layout/Breadcrumb';
import OGFinderClient from '@/components/OG/OGFinderClient';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">OG Finder</h1>
      <OGFinderClient isLoading={true} />
    </div>
  );
}
