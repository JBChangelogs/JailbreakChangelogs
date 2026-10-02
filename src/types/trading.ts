export interface TradeItem {
  id: number;
  name: string;
  type: string;
  cash_value: string | null;
  duped_value: string | null;
  is_limited: number | null;
  is_seasonal: number | null;
  season?: number | null;
  level?: number | string | null;
  tradable: number;
  trend?: string | null;
  notes?: string | null;
  side?: "offering" | "requesting";
  metadata?: {
    TimesTraded?: number;
    UniqueCirculation?: number;
    DemandMultiple?: number;
    LastUpdated?: number;
  };
  demand?: string | null;
  duped_demand?: string | null;
  isDuped?: boolean;
  isOG?: boolean;
  /** Wire-format fields returned by trade and suggestion APIs. */
  amount?: number;
  duped?: boolean;
  og?: boolean;
  instanceId?: string;
}

export interface TradeAd {
  id: number;
  requesting: TradeItem[];
  offering: TradeItem[];
  author: string;
  note?: string;
  created_at: number;
  expires: number;
  expired: number;
  status: string;
  message_id?: string | null;
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
    usernumber?: number;
    premiumtype?: number;
    settings_v2?: {
      custom_avatar: boolean;
    };
  };
}
