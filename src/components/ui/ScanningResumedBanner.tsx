interface ScanningResumedBannerProps {
  className?: string;
}

export default function ScanningResumedBanner({
  className = "",
}: ScanningResumedBannerProps) {
  return (
    <div
      className={`border-status-success/40 bg-status-success/10 flex items-start gap-4 rounded-lg border p-4 shadow-sm ${className}`}
    >
      <div>
        <span className="text-primary-text text-base font-bold">
          Scanning Resumed
        </span>
        <div className="text-secondary-text mt-1">
          Inventory scanning is back up and running. Inventories, OG item
          history, and dupe reports are updating with new data again.
        </div>
      </div>
    </div>
  );
}
