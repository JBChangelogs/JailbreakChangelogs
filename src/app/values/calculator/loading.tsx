import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 pb-8">
      <div className="border-border-card bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
        <Skeleton
          className="bg-secondary-bg rounded-lg rounded-none"
          style={{ height: 200 }}
        />
      </div>
      <div className="border-border-card bg-secondary-bg hover:border-border-focus rounded-lg border p-4">
        <Skeleton
          className="bg-secondary-bg rounded-lg rounded-none"
          style={{ height: 400 }}
        />
      </div>
    </div>
  );
}
