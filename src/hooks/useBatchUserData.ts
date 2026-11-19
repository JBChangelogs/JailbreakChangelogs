import { useQuery } from "@tanstack/react-query";
import { createLogger } from "@/services/logger";
import type { RobloxUser } from "@/types";
import { withUsernameFallbacks } from "@/utils/helpers/ownerName";

const log = createLogger("API");

interface UseBatchUserDataOptions {
  batchSize?: number;
  enabled?: boolean;
}

interface UseBatchUserDataResult {
  robloxUsers: Record<string, RobloxUser>;
  isLoading: boolean;
  progress: {
    loaded: number;
    total: number;
  };
}

const EMPTY_USERS: Record<string, RobloxUser> = {};

/** Fetches Roblox user details for one batch of IDs. */
export function useBatchUserData(
  userIds: string[],
  options: UseBatchUserDataOptions = {},
): UseBatchUserDataResult {
  const { enabled = true } = options;
  const ids = Array.from(
    new Set(userIds.filter((id) => /^\d+$/.test(id))),
  ).sort();
  const total = ids.length > 0 ? 1 : 0;
  const userQuery = useQuery({
    queryKey: ["batch-user-data", ids],
    queryFn: async ({ signal }): Promise<Record<string, RobloxUser>> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/v2/users/batch`,
          {
            // POST keeps large owner batches out of URL limits.
            method: "POST",
            body: JSON.stringify({ ids: ids.map(Number) }),
            headers: {
              "Content-Type": "application/json",
              "X-Source":
                process.env.NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER ?? "",
            },
            signal,
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as Record<string, RobloxUser>;
        return data && typeof data === "object"
          ? withUsernameFallbacks(data as Record<string, RobloxUser>)
          : EMPTY_USERS;
      } catch (error) {
        if (!signal.aborted) log.error("Failed to fetch Roblox users", error);
        throw error;
      }
    },
    enabled: enabled && total > 0,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    robloxUsers: userQuery.data ?? EMPTY_USERS,
    isLoading: enabled && total > 0 && userQuery.isPending,
    progress: {
      loaded: userQuery.isSuccess || userQuery.isError ? total : 0,
      total,
    },
  };
}
