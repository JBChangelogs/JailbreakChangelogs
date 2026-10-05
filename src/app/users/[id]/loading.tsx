import { Skeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/Layout/Breadcrumb";

export default function UserProfileLoading() {
  const connections = (
    <>
      <Skeleton className="h-8 w-21" />
      <Skeleton className="h-8 w-20" />
    </>
  );

  return (
    <main
      className="min-h-screen pb-8"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="container mx-auto max-w-7xl">
        <Breadcrumb loading={true} />
        <div className="border-border-card bg-secondary-bg overflow-hidden rounded-2xl border">
          <Skeleton className="h-40 rounded-none md:h-70" />
          <div className="px-5 pt-5 pb-6 sm:px-6 md:px-8 md:pb-8">
            <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 md:grid-cols-[176px_minmax(0,1fr)_auto] md:items-start md:gap-x-7">
              <div className="relative -mt-10 flex flex-col items-center md:row-span-2">
                <div className="bg-secondary-bg rounded-full p-1">
                  <Skeleton className="size-24 rounded-full md:size-38" />
                </div>
                <div className="mt-3 hidden flex-wrap justify-center gap-2 md:flex">
                  {connections}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-9 w-28 max-w-full md:h-10" />
                  <Skeleton className="hidden h-9 w-56 max-w-full md:block" />
                </div>
                <Skeleton className="mt-1 h-5 w-24 max-w-full" />
              </div>
              <div className="col-span-2 space-y-3 md:col-span-1 md:col-start-2 md:row-start-2">
                <Skeleton className="h-9 w-56 max-w-full md:hidden" />
                <Skeleton className="h-5 w-72 max-w-full" />
                <div className="flex flex-wrap gap-6 md:mt-4">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <div className="flex flex-wrap gap-2 md:hidden">
                  {connections}
                </div>
              </div>
              <div className="col-span-2 flex gap-2 md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1 md:max-w-64 md:flex-wrap md:justify-end xl:max-w-none">
                <Skeleton className="h-8 w-21 md:h-10 md:w-31" />
                <Skeleton className="h-8 w-22 md:h-10 md:w-33" />
                <Skeleton className="h-8 w-24 md:h-10 md:w-33" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 md:mt-6">
          <div className="border-border-card flex gap-4 overflow-hidden border-b py-3">
            <Skeleton className="h-5 w-16 shrink-0" />
            <Skeleton className="h-5 w-24 shrink-0" />
            <Skeleton className="h-5 w-24 shrink-0" />
            <Skeleton className="h-5 w-32 shrink-0" />
          </div>
          <div className="border-border-card bg-secondary-bg mt-5 rounded-2xl border p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="size-8" />
            </div>
            <Skeleton className="h-6 w-96 max-w-full" />
            <Skeleton className="mt-4 h-4 w-36" />
          </div>
        </div>
      </div>
    </main>
  );
}
