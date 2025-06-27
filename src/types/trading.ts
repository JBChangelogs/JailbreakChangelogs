export interface TradeItem {
  id: number;
  name: string;
  type: string;
  cash_value: string;
  duped_value: string;
  is_limited: number | null;
  is_seasonal: number | null;
  tradable: number;
  base_name?: string;
  side?: 'offering' | 'requesting';
  children?: Array<{
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
      description: string;
      health: number;
      tradable: boolean;
      last_updated: number;
    };
  }>;
  is_sub: boolean;
  sub_name?: string;
  data?: {
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
    description: string;
    health: number;
    tradable: boolean;
    last_updated: number;
  };
  demand?: string;
}

export interface TradeAd {
  id: number;
  requesting: TradeItem[];
  offering: TradeItem[];
  author: string;
  created_at: number;
  expires: number;
  expired: number;
  status: string;
  user?: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    roblox_id?: string;
    roblox_username?: string;
    roblox_display_name?: string;
    roblox_avatar?: string;
    accent_color?: string;
    custom_avatar?: string;
    settings?: {
      avatar_discord: number;
    };
  };
} 