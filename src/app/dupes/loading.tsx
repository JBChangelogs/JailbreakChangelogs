import Breadcrumb from '@/components/Layout/Breadcrumb';
import DupeFinderClient from '@/components/Dupes/DupeFinderClient';

export default function DupeFinderLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Dupe Finder</h1>
        <span className="text-[10px] uppercase font-semibold text-white bg-[#5865F2] px-1.5 py-0.5 rounded">New</span>
      </div>
      <DupeFinderClient isLoading={true} />
    </div>
  );
}
