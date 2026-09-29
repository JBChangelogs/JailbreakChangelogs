export function PendingTradeItemsPlaceholder({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`border-border-card bg-tertiary-bg text-secondary-text flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center ${className}`}
    >
      <span
        aria-hidden="true"
        className="border-border-card text-primary-text flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold"
      >
        ?
      </span>
      <span className="text-xs font-medium">Items not scanned yet</span>
    </div>
  );
}
