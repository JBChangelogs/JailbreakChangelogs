"use client";

import { useTrackerWebSocket } from "./useTrackerWebSocket";

export interface BountyData {
  bounty: number;
  display_name: string;
  userid: number;
  inventory: string[];
  server?: {
    job_id: string;
    server_time: number;
    timestamp: number;
    bot_id: number;
    players: {
      user_id: string;
      username: string | null;
      team: string;
      level: number;
      has_season_pass: boolean;
      money: number;
      xp: number;
      gamepasses: string[];
    }[];
  };
  server_time: number;
  timestamp: number;
}

export function useRobberyTrackerBountiesWebSocket(
  enabled: boolean = true,
  userId?: string | null,
) {
  const { data: bounties, ...rest } = useTrackerWebSocket<BountyData>({
    endpoint: "/tracker?type=bounties",
    messageAction: "recent_bounties",
    enabled,
    userId,
    logPrefix: "Bounty tracker",
  });

  return { bounties, ...rest };
}
