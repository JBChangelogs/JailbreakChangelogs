export type ItemType =
  | "Vehicle"
  | "Spoiler"
  | "Rim"
  | "Body Color"
  | "HyperChrome"
  | "Texture"
  | "Tire Sticker"
  | "Tire Style"
  | "Drift"
  | "Furniture"
  | "Horn"
  | "Weapon Skin";

export type FilterSort =
  | "name-all-items"
  | "name-limited-items"
  | "name-untradeable-items"
  | "name-seasonal-items"
  | "name-vehicles"
  | "name-spoilers"
  | "name-rims"
  | "name-body-colors"
  | "name-hyperchromes"
  | "name-textures"
  | "name-tire-stickers"
  | "name-tire-styles"
  | "name-drifts"
  | "name-furnitures"
  | "name-horns"
  | "name-weapon-skins"
  | "favorites"
  | "demand-close-to-none"
  | "demand-very-low"
  | "demand-low"
  | "demand-below-average"
  | "demand-average"
  | "demand-decent"
  | "demand-high"
  | "demand-very-high"
  | "trend-stable"
  | "trend-rising"
  | "trend-hyped"
  | "trend-dropping"
  | "trend-unstable"
  | "trend-hoarded"
  | "trend-manipulated"
  | "trend-recovering";

export type ValueSort =
  | "random"
  | "alpha-asc"
  | "alpha-desc"
  | "cash-desc"
  | "cash-asc"
  | "duped-desc"
  | "duped-asc"
  | "demand-desc"
  | "demand-asc"
  | "last-updated-desc"
  | "last-updated-asc"
  | "times-traded-desc"
  | "times-traded-asc"
  | "unique-circulation-desc"
  | "unique-circulation-asc"
  | "season-number-asc"
  | "season-number-desc"
  | "season-level-asc"
  | "season-level-desc"
  | "demand-multiple-desc"
  | "demand-multiple-asc"
  | "demand-close-to-none"
  | "demand-very-low"
  | "demand-low"
  | "demand-below-average"
  | "demand-average"
  | "demand-decent"
  | "demand-high"
  | "demand-very-high"
  | "trend-stable"
  | "trend-rising"
  | "trend-hyped"
  | "trend-dropping"
  | "trend-unstable"
  | "trend-hoarded"
  | "trend-manipulated"
  | "trend-recovering";

interface DupedOwner {
  item_id: number;
  owner: string;
  user_id: null | string;
  proof: null | string;
  created_at: number;
}

export interface RecentChange {
  changelog_id: number;
  suggestion_id: number;
  changed_by: string;
  created_at: number;
  field: string;
  current_value: string;
  suggested_value: string;
}

export interface Item {
  id: number;
  name: string;
  type: string;
  creator: string | null;
  is_seasonal: number;
  season: number | null;
  level: number | string | null;
  cash_value: string | null;
  duped_value: string | null;
  price: string;
  is_limited: number;
  duped_owners: DupedOwner[] | [];
  notes: string | null;
  demand: string | null;
  duped_demand: string | null;
  trend: string | null;
  description: string | null;
  health: number | null;
  tradable: number;
  last_updated: number;
  recent_changes?: RecentChange[] | null;
  metadata?: {
    TimesTraded?: number;
    UniqueCirculation?: number;
    TimesScanned?: number;
    DemandMultiple?: number;
    LastUpdated?: number;
  };
}

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  username: string;
  hasVerifiedBadge?: boolean;
}

export interface ItemDetails {
  id: number;
  name: string;
  type: string;
  creator: string | null;
  is_seasonal: number | null;
  season: number | null;
  level: number | string | null;
  cash_value: string | null;
  duped_value: string | null;
  price: string;
  is_limited: number | null;
  duped_owners: DupedOwner[] | string;
  notes: string | null;
  demand: string | null;
  duped_demand: string | null;
  trend: string | null;
  description: string | null;
  health: number | null;
  tradable: boolean | number;
  last_updated: number;
  recent_changes?: RecentChange[] | null;
  metadata?: {
    TimesTraded?: number;
    UniqueCirculation?: number;
    TimesScanned?: number;
    DemandMultiple?: number;
    LastUpdated?: number;
  };
}

export interface FavoriteItem {
  created_at: number;
  item: Pick<Item, "id" | "name" | "type"> &
    Partial<Omit<Item, "is_limited" | "is_seasonal">> & {
      is_limited?: number | null;
      is_seasonal?: number | null;
    };
}

export interface DupeFinderHistoryEntry {
  UserId: number;
  TradeTime: number;
}

interface DupeFinderInfo {
  title: string;
  value: string;
}

export interface DupeFinderItem {
  item_id: number;
  latest_owner?: string;
  user_id?: string;
  logged_at: number;
  tradePopularMetric: number;
  dupe_ratio?: number | null;
  level: number | null;
  history: DupeFinderHistoryEntry[];
  timesTraded: number;
  id: string;
  categoryTitle: string;
  info: DupeFinderInfo[];
  uniqueCirculation: number;
  season: number | null;
  title: string;
  isOriginalOwner: boolean;
  Sign?: string[] | null;
  scan_id?: string;
}

export interface DuplicateVariantsResponse {
  og: DupeFinderItem;
  duplicate: DupeFinderItem;
}

export interface DupeOwnerSearchResult {
  id: string;
  name: string;
  displayName: string;
  total_dupes: string;
}

export interface DupeItemSearchResult {
  id: number;
  item_id: string;
  name: string;
  type: string;
  owner_id: string;
  username: string;
}
