"use client";

import { useOptimizedRealTimeRelativeDate } from "@/hooks/useSharedTimer";
import { compactRelativeLabel } from "@/utils/messages/formatting";

export function ConversationRowTime({
  timestamp,
  cacheKey,
}: {
  timestamp?: number;
  cacheKey: string;
}) {
  const relative = useOptimizedRealTimeRelativeDate(
    timestamp ?? null,
    cacheKey,
  );
  const compact = compactRelativeLabel(relative);
  if (!compact) return null;
  return (
    <span className="text-secondary-text shrink-0 text-[11px] tabular-nums">
      {compact}
    </span>
  );
}
