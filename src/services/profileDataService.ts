import type { QueryClient } from "@tanstack/react-query";
import { profileSocialQueryOptions } from "@/utils/api/profileSocialQueries";
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
  queryClient: QueryClient,
  viewerId: string | null,
): Promise<ProfileDataResult> {
  try {
    // Fetch additional data in parallel
    const [followersData, followingData, bioResponse] = await Promise.all([
      queryClient
        .fetchQuery(profileSocialQueryOptions("followers", userId, viewerId))
        .catch(() => []),
      queryClient
        .fetchQuery(profileSocialQueryOptions("following", userId, viewerId))
        .catch(() => []),
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
