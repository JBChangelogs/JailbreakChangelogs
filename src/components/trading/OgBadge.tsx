export function OgBadge({
  compact = false,
  title,
}: {
  compact?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`text-primary-text inline-flex items-center rounded border border-[#FFD700]/50 bg-[#FFD700]/10 leading-none font-semibold ${compact ? "h-5 px-2 text-[10px]" : "h-6 px-2.5 text-xs"}`}
    >
      OG
    </span>
  );
}
