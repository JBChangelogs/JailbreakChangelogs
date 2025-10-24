import { useQueries } from "@tanstack/react-query";
import { fetchLeaderboardUserData } from "@/app/leaderboard/actions";
import { useMemo } from "react";

/**
 * Custom hook to fetch user data for leaderboards with granular caching.
 * Splits user IDs into batches and caches each batch separately,
 * allowing cache reuse across different leaderboards.
 */
export function useLeaderboardUserData(userIds: string[]) {
  // Split user IDs into batches of 100 for granular caching
  const batches = useMemo(() => {
    const BATCH_SIZE = 100;
    const result: string[][] = [];
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      result.push(userIds.slice(i, i + BATCH_SIZE));
    }
    return result;
  }, [userIds]);

  // Fetch each batch separately with its own cache key
  const queries = useQueries({
    queries: batches.map((batch) => ({
      queryKey: ["leaderboardUserData", batch.sort()],
      queryFn: async () => {
        const result = await fetchLeaderboardUserData(batch);
        return {
          userData: result.userData || {},
          avatarData: result.avatarData || {},
        };
      },
      staleTime: 60 * 60 * 1000, // 1 hour cache
      enabled: batch.length > 0,
    })),
  });

  // Combine all batch results into a single object
  const combinedData = useMemo(() => {
    let allUserData: Record<string, unknown> = {};
    let allAvatarData: Record<string, string> = {};

    queries.forEach((query) => {
      if (query.data) {
        if (query.data.userData && typeof query.data.userData === "object") {
          allUserData = { ...allUserData, ...query.data.userData };
        }
        if (
          query.data.avatarData &&
          typeof query.data.avatarData === "object"
        ) {
          allAvatarData = { ...allAvatarData, ...query.data.avatarData };
        }
      }
    });

    return { userData: allUserData, avatarData: allAvatarData };
  }, [queries]);

  // Check if any query is still loading
  const isLoading = queries.some((query) => query.isLoading);

  return {
    data: combinedData,
    isLoading,
  };
}
