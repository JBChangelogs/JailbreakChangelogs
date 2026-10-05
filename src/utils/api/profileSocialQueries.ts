import { queryOptions } from "@tanstack/react-query";
import type { FollowerData, FollowingData, UserSettingsV2 } from "@/types/auth";
import { PUBLIC_API_URL } from "./api";
import { buildApiFetchRequest } from "./apiDevToken";
import { fetchWithRetry } from "./fetchWithRetry";

export interface ProfileSocialUser {
  id: string;
  username: string;
  avatar: string;
  global_name: string;
  usernumber: number;
  accent_color: string;
  custom_avatar?: string;
  settings_v2?: UserSettingsV2;
  premiumtype?: number;
}

export type ProfileFollower = FollowerData & { user?: ProfileSocialUser };
export type ProfileFollowing = FollowingData & { user?: ProfileSocialUser };

type SocialLists = {
  followers: ProfileFollower[];
  following: ProfileFollowing[];
};

export function profileSocialQueryOptions<T extends keyof SocialLists>(
  kind: T,
  userId: string,
  viewerId: string | null,
) {
  return queryOptions({
    queryKey: [kind, userId, viewerId],
    queryFn: async ({ signal }): Promise<SocialLists[T]> => {
      if (!/^[0-9]+$/.test(userId)) throw new Error("Invalid user ID");
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/${userId}/${kind}`,
      );
      const response = await fetchWithRetry(
        url,
        { headers, signal, credentials: "include" },
        {
          maxRetries: 2,
          initialDelayMs: 700,
          timeoutMs: 10000,
        },
      );
      if (response.status === 404) return [];
      if (!response.ok) throw new Error(`Failed to load ${kind}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
