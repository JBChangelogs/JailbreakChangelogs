"use client";

import { useTrackerWebSocket } from "./useTrackerWebSocket";
import type { RobberyData } from "./useRobberyTrackerWebSocket";

export function useRobberyTrackerMansionsWebSocket(
  enabled: boolean = true,
  userId?: string | null,
) {
  const { data: mansions, ...rest } = useTrackerWebSocket<RobberyData>({
    endpoint: "/tracker?type=mansions",
    messageAction: "recent_mansions",
    enabled,
    userId,
    logPrefix: "Mansion tracker",
  });

  return { mansions, ...rest };
}
