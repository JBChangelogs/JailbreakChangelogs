// User Data API Response Types
interface RobloxUserData {
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: string | null;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
}

export interface RobloxUsersResponse {
  [userId: string]: RobloxUserData;
}

// User Connection Data API Response Types
interface UserConnectionItem {
  requestedUsername: string;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
}

export interface UserConnectionResponse {
  data: UserConnectionItem[];
}

// Dupe Finder Data API Response Types
interface DupeFinderItem {
  item_id: number;
  latest_owner?: string;
  logged_at: number;
  tradePopularMetric: number;
  level: number | null;
  history: Array<{
    UserId: number;
    TradeTime: number;
  }>;
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
}

export type DupeFinderResponse = DupeFinderItem[];
