import Breadcrumb from '@/components/Layout/Breadcrumb';
import DupeFinderClient from '@/components/Dupes/DupeFinderClient';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-3xl font-bold mb-6">Dupe Finder</h1>
      <DupeFinderClient isLoading={true} />
    </div>
  );
}
