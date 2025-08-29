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
  | "favorites";

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
  | "demand-close-to-none"
  | "demand-very-low"
  | "demand-low"
  | "demand-medium"
  | "demand-decent"
  | "demand-high"
  | "demand-very-high"
  | "demand-extremely-high"
  | "trend-stable"
  | "trend-rising"
  | "trend-hyped"
  | "trend-avoided"
  | "trend-dropping"
  | "trend-unstable"
  | "trend-hoarded"
  | "trend-projected"
  | "trend-recovering";

export interface DupedOwner {
  item_id: number;
  owner: string;
  user_id: null | string;
  proof: null | string;
  created_at: number;
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
  trend: string | null;
  description: string;
  health: number;
  tradable: number;
  last_updated: number;
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
  trend: string;
  description: string;
  health: number;
  tradable: boolean | number;
  last_updated: number;
  metadata?: {
    TimesTraded?: number;
    UniqueCirculation?: number;
    DemandMultiple?: number;
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
