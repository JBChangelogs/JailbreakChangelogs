import Breadcrumb from "@/components/Layout/Breadcrumb";
import DupeFinderClient from "@/components/Dupes/DupeFinderClient";

export default function DupeFinderLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold">Dupe Finder</h1>
        <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
          New
        </span>
      </div>
      <DupeFinderClient isLoading={true} />
    </div>
  );
}
