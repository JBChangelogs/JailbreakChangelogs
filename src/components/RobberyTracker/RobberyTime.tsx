"use client";

import { memo, useCallback, useState } from "react";
import {
  useOptimizedRealTimeRelativeDate,
  useSharedTimer,
} from "@/hooks/useSharedTimer";

export const RobberyRelativeTime = memo(function RobberyRelativeTime({
  timestamp,
  id,
}: {
  timestamp: number;
  id: string;
}) {
  return useOptimizedRealTimeRelativeDate(timestamp, id) || "Just now";
});

export function formatRobberyCountdown(
  deadline: number,
  now: number,
  kind: "plane" | "casino",
): string {
  const diff = deadline - now;
  const remaining = kind === "plane" ? Math.abs(diff) : Math.max(0, diff);
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const duration =
    kind === "plane" && hours > 0
      ? `${hours}h ${minutes % 60}m`
      : minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;

  if (kind === "casino") return duration;
  return diff > 0 ? `Departs in ${duration}` : `Departed ${duration} ago`;
}

export const RobberyCountdown = memo(function RobberyCountdown({
  deadline,
  kind,
  id,
}: {
  deadline: number;
  kind: "plane" | "casino";
  id: string;
}) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const updateCountdown = useCallback(() => {
    setNow(Math.floor(Date.now() / 1000));
  }, []);
  useSharedTimer(id, updateCountdown);

  return formatRobberyCountdown(deadline, now, kind);
});
