export default function MostDuplicatedItemsSkeleton() {
  return (
    <div className="mt-6">
      <div className="border-border-card bg-secondary-bg shadow-card-shadow mb-6 rounded-lg border p-6">
        <div className="bg-tertiary-bg mb-4 h-7 w-64 animate-pulse rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="border-border-card bg-tertiary-bg h-14 w-full animate-pulse rounded-lg border"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
