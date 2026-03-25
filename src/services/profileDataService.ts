import { BASE_API_URL } from "@/utils/api";
import {
  fetchFavoritesData,
  fetchFavoriteItemDetails,
} from "@/app/users/[id]/actions";
import { logError, logApiError } from "@/services/logger";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import type { TradeAd, TradeItem } from "@/types/trading";

export interface ProfileDataResult {
  followerCount: number;
  followingCount: number;
  bio: string | null;
  bioLastUpdated: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  privateServers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  favorites: any[];
  favoriteItemDetails: Record<string, unknown>;
  tradeAds: TradeAd[];
}

/**
 * Service for fetching user profile data (followers, bio, comments, servers, etc.)
 * Extracts the parallel fetching logic from UserProfileDataStreamer
 */
export class ProfileDataService {
  private static async fetchCommentsWithRetry(userId: string) {
    try {
      const response = await fetchWithRetry(
        `${BASE_API_URL}/users/comments/get?author=${userId}`,
        undefined,
        {
          maxRetries: 3,
          initialDelayMs: 800,
          timeoutMs: 10000,
        },
      );

      if (!response.ok) {
        if (response.status !== 404) {
          logApiError(
            "/users/comments/get",
            response.status,
            "Error fetching comments",
            {
              component: "ProfileDataService",
            },
          );
        }
        return [];
      }

      const commentsData = await response.json();
      return Array.isArray(commentsData) ? commentsData : [];
    } catch (error) {
      logError("Error fetching comments with retry", error, {
        component: "ProfileDataService",
        action: "fetch_comments_with_retry",
      });
      return [];
    }
  }

  /**
   * Fetches all additional profile data in parallel
   */
  static async fetchProfileData(userId: string): Promise<ProfileDataResult> {
    try {
      interface V2TradeItemInfo {
        cash_value?: string | null;
        duped_value?: string | null;
        trend?: string | null;
        demand?: string | null;
        notes?: string | null;
      }

      interface V2TradeItem {
        id?: string | number | null;
        duped?: boolean;
        amount?: number;
        og?: boolean;
        name?: string | null;
        type?: string | null;
        info?: V2TradeItemInfo | null;
      }

      interface V2TradeUser {
        id?: string;
        roblox_id?: string;
        roblox_username?: string;
        roblox_display_name?: string;
        roblox_avatar?: string;
        premiumtype?: number;
        username?: string;
        global_name?: string;
        usernumber?: number;
      }

      interface V2Trade {
        id: number;
        note?: string | null;
        status?: string | null;
        requesting?: V2TradeItem[];
        offering?: V2TradeItem[];
        user?: V2TradeUser | null;
        created_at?: number;
        expires?: number;
      }

      const now = Math.floor(Date.now() / 1000);
      const toValidEpoch = (value: unknown): number => {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (typeof value === "string") {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) return parsed;
        }
        return now;
      };

      const normalizeV2Items = (items: V2TradeItem[] = []): TradeItem[] => {
        return items.flatMap((item, index) => {
          const amount = Math.max(1, Number(item.amount) || 1);
          const parsedId = Number(item.id);
          const fallbackId = -(index + 1);
          const itemId = Number.isFinite(parsedId) ? parsedId : fallbackId;

          const normalized: TradeItem = {
            id: itemId,
            instanceId: String(item.id ?? itemId),
            name: item.name || "Unknown Item",
            type: item.type || "Unknown",
            cash_value: item.info?.cash_value || "N/A",
            duped_value: item.info?.duped_value || "N/A",
            is_limited: null,
            is_seasonal: null,
            tradable: 1,
            trend: item.info?.trend || "N/A",
            demand: item.info?.demand || "N/A",
            isDuped: item.duped ?? false,
            isOG: item.og ?? false,
          };

          return Array.from({ length: amount }, () => normalized);
        });
      };

      const normalizeV2Trade = (trade: V2Trade): TradeAd => {
        const createdAt = toValidEpoch(trade.created_at);
        const expiresAt = toValidEpoch(trade.expires);
        const isExpired = expiresAt <= now;
        const status =
          (trade.status && trade.status.trim()) ||
          (isExpired ? "Expired" : "Pending");

        return {
          id: trade.id,
          note: trade.note ?? "",
          requesting: normalizeV2Items(trade.requesting),
          offering: normalizeV2Items(trade.offering),
          author: trade.user?.id || "",
          created_at: createdAt,
          expires: expiresAt,
          expired: isExpired ? 1 : 0,
          status,
          message_id: null,
          user: trade.user
            ? {
                id: trade.user.id || "",
                username: trade.user.username || "Unknown",
                global_name: trade.user.global_name,
                avatar: undefined,
                roblox_id: trade.user.roblox_id,
                roblox_username: trade.user.roblox_username,
                roblox_display_name: trade.user.roblox_display_name,
                roblox_avatar: trade.user.roblox_avatar,
                premiumtype: trade.user.premiumtype ?? 0,
                usernumber: trade.user.usernumber,
              }
            : undefined,
        };
      };

      // Fetch additional data in parallel
      const [
        followersResponse,
        followingResponse,
        bioResponse,
        commentsData,
        serversResponse,
        favoritesData,
        tradeAdsResponse,
      ] = await Promise.all([
        fetchWithRetry(
          `${BASE_API_URL}/users/followers/get?user=${userId}`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${BASE_API_URL}/users/following/get?user=${userId}`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${BASE_API_URL}/users/description/get?user=${userId}&nocache=true`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        this.fetchCommentsWithRetry(userId),
        fetchWithRetry(
          `${BASE_API_URL}/servers/get?owner=${userId}`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchFavoritesData(userId),
        fetchWithRetry(
          `${BASE_API_URL}/trades/v2/recent?limit=24&user=${encodeURIComponent(userId)}`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
      ]);

      // Process responses
      const followersData = followersResponse?.ok
        ? await followersResponse.json()
        : [];
      const followingData = followingResponse?.ok
        ? await followingResponse.json()
        : [];
      const bioData = bioResponse?.ok ? await bioResponse.json() : null;
      const serversData = serversResponse?.ok
        ? await serversResponse.json()
        : [];

      // Process trade ads response
      let tradeAdsData: TradeAd[] = [];
      if (tradeAdsResponse?.ok) {
        try {
          const tradeAdsResponseData =
            (await tradeAdsResponse.json()) as unknown;
          if (Array.isArray(tradeAdsResponseData)) {
            tradeAdsData = tradeAdsResponseData
              .map((trade) => normalizeV2Trade(trade as V2Trade))
              .filter(
                (trade) => trade.requesting.length || trade.offering.length,
              );
          } else {
            tradeAdsData = [];
          }
        } catch (error) {
          logError("Error parsing trade ads response", error, {
            component: "ProfileDataService",
            action: "parse_trade_ads",
          });
          tradeAdsData = [];
        }
      } else if (tradeAdsResponse && tradeAdsResponse.status !== 404) {
        logApiError(
          "/trades/v2/recent",
          tradeAdsResponse.status,
          "Error fetching trade ads",
          {
            component: "ProfileDataService",
          },
        );
      }

      // Fetch item details for favorites (only if we have favorites data)
      const favoriteItemDetails =
        Array.isArray(favoritesData) && favoritesData.length > 0
          ? await fetchFavoriteItemDetails(favoritesData)
          : {};

      return {
        followerCount: Array.isArray(followersData) ? followersData.length : 0,
        followingCount: Array.isArray(followingData) ? followingData.length : 0,
        bio: bioData?.description || null,
        bioLastUpdated: bioData?.last_updated || null,
        comments: Array.isArray(commentsData) ? commentsData : [],
        privateServers: Array.isArray(serversData) ? serversData : [],
        favorites: Array.isArray(favoritesData) ? favoritesData : [],
        favoriteItemDetails,
        tradeAds: tradeAdsData,
      };
    } catch (error) {
      logError("Error fetching profile data", error, {
        component: "ProfileDataService",
        action: "fetch_profile_data",
      });
      throw error;
    }
  }

  /**
   * Returns default empty profile data for error cases
   */
  static getDefaultProfileData(): ProfileDataResult {
    return {
      followerCount: 0,
      followingCount: 0,
      bio: null,
      bioLastUpdated: null,
      comments: [],
      privateServers: [],
      favorites: [],
      favoriteItemDetails: {},
      tradeAds: [],
    };
  }
}
