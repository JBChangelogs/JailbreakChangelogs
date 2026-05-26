import { PUBLIC_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("API");
import { fetchWithRetry } from "@/utils/api/fetchWithRetry";
import type { TradeAd } from "@/types/trading";

export interface ProfileDataResult {
  followerCount: number;
  followingCount: number;
  bio: string | null;
  bioLastUpdated: number | null;
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  privateServers: any[];
  tradeAds: TradeAd[];
}

/**
 * Service for fetching user profile data (followers, bio, servers, etc.)
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
        serversResponse,
      ] = await Promise.all([
        fetchWithRetry(
          `${PUBLIC_API_URL}/users/followers/get?user=${userId}`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${PUBLIC_API_URL}/users/following/get?user=${userId}`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${PUBLIC_API_URL}/users/description/get?user=${userId}&nocache=true`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${PUBLIC_API_URL}/servers/get?owner=${userId}`,
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

      return {
        followerCount: Array.isArray(followersData) ? followersData.length : 0,
        followingCount: Array.isArray(followingData) ? followingData.length : 0,
        bio: bioData?.description || null,
        bioLastUpdated: bioData?.last_updated || null,
        privateServers: Array.isArray(serversData) ? serversData : [],
        tradeAds: [],
      };
    } catch (error) {
      log.error("Error fetching profile data", error);
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
      privateServers: [],
      tradeAds: [],
    };
  }
}
