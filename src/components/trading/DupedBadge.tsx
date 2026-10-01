export function DupedBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`bg-status-error/90 text-form-button-text inline-flex items-center rounded leading-none font-semibold ${compact ? "h-5 px-2 text-[10px]" : "h-6 px-2.5 text-xs"}`}
    >
      Duped
    </span>
  );
}
