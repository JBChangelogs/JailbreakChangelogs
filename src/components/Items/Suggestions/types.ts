import type { Item } from "@/types/index";

export interface SuggestionLimits {
  min_characters: number;
  max_characters: number;
  max_note_length: number;
  valid_fields: string[];
  valid_trends: string[];
  valid_demands: string[];
  max_cash: number;
}

export interface UserSettings {
  custom_avatar?: boolean;
  hide_presence?: boolean | number;
  profile_public?: boolean | number;
  custom_banner?: boolean;
  hide_connections?: boolean;
  dms_allowed?: boolean | number;
  allow_gifting?: boolean;
  show_recent_comments?: boolean | number;
  hide_following?: boolean | number;
  hide_followers?: boolean | number;
  hide_favorites?: boolean | number;
}

export interface SuggestionUser {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string | null;
  custom_avatar?: string | null;
  premiumtype?: number;
  usernumber?: number;
  settings?: UserSettings;
  roblox_id?: string;
  roblox_username?: string;
  roblox_display_name?: string;
  roblox_avatar?: string;
}

export interface Suggestion {
  id: number;
  item_id: number;
  field: string;
  current_value: string;
  suggested_value: string;
  reason: string;
  status: string;
  upvotes: number;
  downvotes: number;
  is_vt: number;
  created_at: number;
  updated_at: number;
  user: SuggestionUser;
  item?: Item;
  votes: {
    upvotes: { created_at: number; user: SuggestionUser }[];
    downvotes: { created_at: number; user: SuggestionUser }[];
  };
}

export interface SuggestionsResponse {
  total: number;
  items: Suggestion[];
  page: number;
  total_pages: number;
  size: number;
}

export interface LeaderboardEntry {
  total_submitted: number;
  total_accepted: number;
  total_rejected: number;
  total_expired: number;
  acceptance_rate: number;
  user: SuggestionUser;
}
