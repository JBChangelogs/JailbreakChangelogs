interface InventoryLoggingAlertBannerProps {
  className?: string;
}

export default function InventoryLoggingAlertBanner({
  className = "",
}: InventoryLoggingAlertBannerProps) {
  return (
    <div
      className={`border-status-warning/40 bg-status-warning/10 flex items-start gap-4 rounded-lg border p-4 shadow-sm ${className}`}
    >
      <div>
        <span className="text-primary-text text-base font-bold">
          Scanning Paused
        </span>
        <div className="text-secondary-text mt-1">
          Inventory scanning is currently paused. Badimo appears to have made
          changes that are causing trade bot bans (4 as of August 6th), so
          we&apos;re unable to safely scan inventories right now. This means
          inventories, OG item history, and dupe reports are not currently
          updating with new data. We don&apos;t have a timeline for when this
          will resume.
        </div>
      </div>
    </div>
  );
}
