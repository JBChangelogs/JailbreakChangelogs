import { BASE_API_URL } from "@/utils/api";
import {
  fetchFavoritesData,
  fetchFavoriteItemDetails,
} from "@/app/users/[id]/actions";
import { logError, logApiError } from "@/services/logger";

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
        commentsResponse,
        serversResponse,
        favoritesData,
        tradeAdsResponse,
      ] = await Promise.all([
        fetch(`${BASE_API_URL}/users/followers/get?user=${userId}`),
        fetch(`${BASE_API_URL}/users/following/get?user=${userId}`),
        fetch(
          `${BASE_API_URL}/users/description/get?user=${userId}&nocache=true`,
        ),
        fetch(`${BASE_API_URL}/users/comments/get?author=${userId}`),
        fetch(`${BASE_API_URL}/servers/get?owner=${userId}`),
        fetchFavoritesData(userId),
        fetch(`${BASE_API_URL}/trades/get?user=${userId}`),
      ]);

      // Process responses
      const followersData = await followersResponse.json();
      const followingData = await followingResponse.json();
      const bioData = await bioResponse.json();
      const commentsData = await commentsResponse.json();
      const serversData = serversResponse.ok
        ? await serversResponse.json()
        : [];

      // Process trade ads response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let tradeAdsData: any[] = [];
      if (tradeAdsResponse.ok) {
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
      } else if (tradeAdsResponse.status !== 404) {
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
