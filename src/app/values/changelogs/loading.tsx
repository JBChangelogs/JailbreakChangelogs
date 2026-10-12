import Breadcrumb from "@/components/Layout/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto mb-8 px-4 sm:px-6">
        <Breadcrumb />
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border-border-card bg-secondary-bg rounded-xl border p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton style={{ width: 130, height: 24 }} />
                  <Skeleton style={{ width: 60, height: 22 }} />
                </div>
                <Skeleton style={{ width: 100, height: 20 }} />
              </div>
              <div className="flex flex-col gap-2">
                {[...Array(2)].map((_, j) => (
                  <Skeleton key={j} style={{ height: 52 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
