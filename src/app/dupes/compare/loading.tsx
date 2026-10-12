import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pb-8">
      <Breadcrumb />
      <div className="mb-8">
        <h1 className="page-heading">Duplicate Comparison</h1>
        <p className="text-secondary-text mt-2">
          Comparing item variants to verify duplicates.
        </p>
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
