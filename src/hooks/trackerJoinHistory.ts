export interface TrackerJoinUser {
  user_id: string | number;
  display_name: string | null;
  joined_at: number;
}

export type TrackerJoinHistory = Record<string, TrackerJoinUser[]>;

export interface TrackerJoinReport {
  server_id: string;
  marker_name: string;
  tracker_type: "robbery" | "bounty";
  display_name: string;
}

export function updateTrackerJoinHistory(
  current: TrackerJoinHistory,
  message: {
    action: string;
    servers?: TrackerJoinHistory;
    data?: { server_id?: string };
    users?: TrackerJoinUser[];
  },
): TrackerJoinHistory {
  if (message.action === "join_history_sync" && message.servers) {
    return message.servers;
  }
  if (
    message.action === "update_join_history" &&
    message.data?.server_id &&
    Array.isArray(message.users)
  ) {
    return { ...current, [message.data.server_id]: message.users };
  }
  return current;
}
