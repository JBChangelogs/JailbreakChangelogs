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
  Sign?: string[] | null;
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
export type TradeStatus = "completed" | "pending";

export interface TradeList<T> {
  completed: T[];
  pending: T[];
}

export interface UserTradeSummary {
  trade_id: string;
  counterparty_user_id: string;
  items_given: TradeItemDetail[];
  items_received: TradeItemDetail[];
  first_time: number;
  last_time: number;
  confidence: TradeConfidence;
  status: TradeStatus;
}

export interface TradeItemDetail {
  item_id: string;
  branch_id: string;
  title: string;
  category_title: string;
  trade_time: number;
  confidence: "confirmed" | "gap";
  is_duplicate_branch: boolean;
  original_owner: string | null;
  given_by_original_owner: boolean;
  received_by_original_owner: boolean;
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
  status: TradeStatus;
}
