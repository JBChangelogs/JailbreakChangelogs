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
  | "season-number-asc"
  | "season-number-desc"
  | "season-level-asc"
  | "season-level-desc"
  | "demand-desc"
  | "demand-asc"
  | "last-updated-desc"
  | "last-updated-asc"
  | "times-traded-desc"
  | "times-traded-asc"
  | "unique-circulation-desc"
  | "unique-circulation-asc"
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

export interface DupedOwner {
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
  creator: string;
  is_seasonal: number;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number;
  duped_owners: DupedOwner[] | [];
  notes: string;
  demand: string;
  duped_demand: string | null;
  trend: string | null;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
  recent_changes?: RecentChange[] | null;
  metadata?: {
    TimesTraded?: number;
    UniqueCirculation?: number;
    DemandMultiple?: number;
    LastUpdated?: number;
  };
  children?: {
    id: number;
    parent: number;
    sub_name: string;
    created_at: number;
    data: {
      name: string;
      type: string;
      creator: string;
      is_seasonal: number | null;
      cash_value: string;
      duped_value: string;
      price: string;
      is_limited: number | null;
      duped_owners: string;
      notes: string;
      demand: string;
      duped_demand: string | null;
      trend?: string | null;
      description: string;
      health: number;
      tradable: boolean;
      last_updated: number;
    };
  }[];
}

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  username: string;
  hasVerifiedBadge?: boolean;
}

export interface RobloxAvatar {
  targetId: number;
  imageUrl: string;
}

export interface ItemHoarder {
  user_id: string;
  count: number;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
}

export interface SearchFilters {
  name?: string;
  type?: string;
  minValue?: number;
  maxValue?: number;
  isLimited?: boolean;
  isSeasonal?: boolean;
  isTradable?: boolean;
}

export type SortOption = "cash_value";
export type SortOrder = "asc" | "desc";

export interface ItemDetails {
  id: number;
  name: string;
  type: string;
  creator: string;
  is_seasonal: number | null;
  cash_value: string;
  duped_value: string;
  price: string;
  is_limited: number | null;
  duped_owners: DupedOwner[] | string;
  notes: string;
  demand: string;
  duped_demand: string | null;
  trend: string;
  description: string;
  health: number;
  tradable: boolean | number;
  last_updated: number;
  recent_changes?: RecentChange[] | null;
  metadata?: {
    TimesTraded?: number;
    UniqueCirculation?: number;
    DemandMultiple?: number;
    LastUpdated?: number;
  };
  children?: Array<{
    id: number;
    parent: number;
    sub_name: string;
    created_at: number;
    data: ItemDetails;
  }>;
}

export interface DupeResult {
  item_id: number;
  owner: string;
  user_id: number | null;
  proof: string | null;
  created_at: number;
}

export interface FavoriteItem {
  created_at: number;
  item: {
    id: number;
    name: string;
    type: string;
    parent?: number;
    sub_name?: string;
    data?: {
      name: string;
      type: string;
    };
  };
}

export interface DupeFinderHistoryEntry {
  UserId: number;
  TradeTime: number;
}

export interface DupeFinderInfo {
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
