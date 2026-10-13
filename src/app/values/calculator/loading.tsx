import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function Loading() {
  return (
    <main className="container mx-auto space-y-6 px-4 pb-8 sm:px-6 lg:px-8">
      <Breadcrumb />
      <div className="space-y-3">
        <Skeleton className="h-9 w-full max-w-96" />
        <Skeleton className="h-5 w-full" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>
      <div className="border-border-card bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
        <Skeleton className="rounded-lg rounded-none" style={{ height: 400 }} />
      </div>
    </main>
  );
}
