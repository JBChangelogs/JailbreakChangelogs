import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/Spinner";

export function MessageThreadLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        aria-hidden="true"
        className="bg-tertiary-bg border-border-card flex items-center gap-3 border-b px-4 py-3"
      >
        <Skeleton className="size-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3"
        role="status"
      >
        <Spinner className="size-6" />
        <p className="text-secondary-text text-sm">Loading messages...</p>
      </div>
      <Skeleton aria-hidden="true" className="mx-3 mb-3 h-12 rounded-xl" />
    </div>
  );
}
