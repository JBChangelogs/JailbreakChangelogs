export interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

export interface InventoryItem {
  tradePopularMetric: number | null;
  item_id: number;
  level: number | null;
  history: TradeHistoryEntry[];
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: Array<{
    title: string;
    value: string;
  }>;
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  scan_id: string;
  is_duplicated: boolean;
}

export interface InventoryData {
  user_id: string;
  data: InventoryItem[];
  item_count: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
  bot_id: string;
  scan_count: number;
  scan_id: string;
  created_at: number;
  updated_at: number;
}

export interface UserConnectionData {
  id: string;
  username: string;
  global_name: string;
  roblox_id: string | null;
  roblox_username?: string;
}
