export default function VersionInfoSkeleton() {
  return (
    <div className="text-secondary-text space-y-1 text-xs leading-relaxed">
      <div className="flex items-center gap-1">
        <span>Version:</span>
        <div className="bg-button-secondary h-3 w-16 animate-pulse rounded"></div>
      </div>
      <div className="flex items-center gap-1">
        <span>Environment:</span>
        <div className="bg-button-secondary h-3 w-20 animate-pulse rounded"></div>
      </div>
      <div className="flex items-center gap-1">
        <span>Updated:</span>
        <div className="bg-button-secondary h-3 w-24 animate-pulse rounded"></div>
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-2 text-base">
          <span>Built on</span>
          <div className="bg-button-secondary h-6 w-28 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}
