import { useQuery } from "@tanstack/react-query";
import { createLogger } from "@/services/logger";
import type { RobloxUser } from "@/types";

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
  const ids = Array.from(new Set(userIds)).sort();
  const total = ids.length > 0 ? 1 : 0;
  const userQuery = useQuery({
    queryKey: ["batch-user-data", ids],
    queryFn: async ({ signal }): Promise<Record<string, RobloxUser>> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/v2`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
              "X-Source":
                process.env.NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER ?? "",
            },
            body: JSON.stringify({ userIds: ids.map(Number) }),
            signal,
          },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as
          | Record<string, RobloxUser>
          | { data: unknown };

        if (data && "data" in data && Array.isArray(data.data)) {
          const userData: Record<string, RobloxUser> = {};
          data.data.forEach((item: unknown) => {
            if (item && typeof item === "object") {
              Object.assign(userData, item);
            }
          });
          return userData;
        }
        return data && typeof data === "object"
          ? (data as Record<string, RobloxUser>)
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
