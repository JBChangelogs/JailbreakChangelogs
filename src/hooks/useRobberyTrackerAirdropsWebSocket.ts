"use client";

import { useTrackerWebSocket } from "./useTrackerWebSocket";

export interface AirdropData {
  location: "CactusValley" | "Dunes";
  color: "Brown" | "Blue" | "Red";
  x: number;
  z: number;
  gone_at: number;
  server_time: number;
  timestamp: number;
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
}

export function getAirdropKey(airdrop: AirdropData): string {
  return `${airdrop.server?.job_id}-${airdrop.location}-${airdrop.color}-${airdrop.x}-${airdrop.z}-${airdrop.timestamp}`;
}

export function useRobberyTrackerAirdropsWebSocket(
  enabled = true,
  userId?: string | null,
) {
  const { data: airdrops, ...rest } = useTrackerWebSocket<AirdropData>({
    endpoint: "/tracker?type=airdrops",
    messageAction: "recent_airdrops",
    enabled,
    userId,
    logPrefix: "Airdrop tracker",
    getItemKey: getAirdropKey,
  });
  return { airdrops, ...rest };
}
