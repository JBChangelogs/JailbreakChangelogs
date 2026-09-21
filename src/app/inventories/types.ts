export interface TradeHistoryEntry {
  UserId: number;
  TradeTime: number;
}

export interface InventoryTradeNote {
  note: string;
  timestamp: number;
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
  trade_note?: InventoryTradeNote | null;
  data: InventoryItem[];
  duplicates?: InventoryItem[];
  item_count: number;
  dupe_count?: number;
  level: number;
  money: number;
  xp: number;
  gamepasses: string[];
  has_season_pass: boolean;
  job_id: string;
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

export type TradeConfidence = "confirmed" | "partial";

export interface UserTradeSummary {
  trade_id: string;
  counterparty_user_id: string;
  items_given: number;
  items_received: number;
  first_time: number;
  last_time: number;
  confidence: TradeConfidence;
}

export interface TradeItemDetail {
  item_id: string;
  branch_id: string;
  title: string;
  category_title: string;
  trade_time: number;
  confidence: "confirmed" | "gap";
  is_duplicate_branch: boolean;
}

export interface TradeDetail {
  trade_id: string;
  user_a: string;
  user_b: string;
  items_a_to_b: TradeItemDetail[];
  items_b_to_a: TradeItemDetail[];
  first_time: number;
  last_time: number;
  confidence: TradeConfidence;
}
