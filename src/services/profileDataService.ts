import { PUBLIC_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("API");
import { fetchWithRetry } from "@/utils/api/fetchWithRetry";

export interface ProfileDataResult {
  followerCount: number;
  followingCount: number;
  bio: string | null;
  bioLastUpdated: number | null;
}

export async function fetchProfileData(
  userId: string,
): Promise<ProfileDataResult> {
  try {
    // Fetch additional data in parallel
    const [followersResponse, followingResponse, bioResponse] =
      await Promise.all([
        fetchWithRetry(
          `${PUBLIC_API_URL}/v2/users/${userId}/followers`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${PUBLIC_API_URL}/v2/users/${userId}/following`,
          undefined,
          {
            maxRetries: 2,
            initialDelayMs: 700,
            timeoutMs: 10000,
          },
        ).catch(() => null),
        fetchWithRetry(
          `${PUBLIC_API_URL}/v2/users/${userId}/description`,
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
    return {
      followerCount: Array.isArray(followersData) ? followersData.length : 0,
      followingCount: Array.isArray(followingData) ? followingData.length : 0,
      bio: bioData?.description || null,
      bioLastUpdated: bioData?.last_updated || null,
    };
  } catch (error) {
    log.error("Error fetching profile data", error);
    throw error;
  }
}
