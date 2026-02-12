import { BASE_API_URL } from "@/utils/api";
import {
  fetchFavoritesData,
  fetchFavoriteItemDetails,
} from "@/app/users/[id]/actions";
import { logError, logApiError } from "@/services/logger";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tradeAds: any[];
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
        fetchWithRetry(`${BASE_API_URL}/trades/get?user=${userId}`, undefined, {
          maxRetries: 2,
          initialDelayMs: 700,
          timeoutMs: 10000,
        }).catch(() => null),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let tradeAdsData: any[] = [];
      if (tradeAdsResponse?.ok) {
        try {
          const tradeAdsResponseData = await tradeAdsResponse.json();
          tradeAdsData = Array.isArray(tradeAdsResponseData)
            ? tradeAdsResponseData
            : [tradeAdsResponseData];
        } catch (error) {
          logError("Error parsing trade ads response", error, {
            component: "ProfileDataService",
            action: "parse_trade_ads",
          });
          tradeAdsData = [];
        }
      } else if (tradeAdsResponse && tradeAdsResponse.status !== 404) {
        logApiError(
          "/trades/get",
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
