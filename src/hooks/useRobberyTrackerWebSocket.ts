"use client";

import { useTrackerWebSocket } from "./useTrackerWebSocket";

export interface ServerRegionData {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export interface RobberyData {
  marker_name: string;
  name: string;
  status: number;
  progress: number | null;
  metadata: {
    casino_code?: string;
    plane_time?: number;
    casino_time?: number;
  } | null;
  job_id: string;
  server_time: number;
  timestamp: number;
  region_id?: string;
  region_data?: ServerRegionData;
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

export function useRobberyTrackerWebSocket(
  enabled: boolean = true,
  userId?: string | null,
) {
  const { data: robberies, ...rest } = useTrackerWebSocket<RobberyData>({
    endpoint: "/tracker",
    messageAction: "recent_robberies",
    enabled,
    userId,
    logPrefix: "Robbery tracker",
  });

  return { robberies, ...rest };
}
