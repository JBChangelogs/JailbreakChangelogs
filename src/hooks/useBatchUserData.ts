import { useState, useEffect, useRef, useMemo } from "react";
import { RobloxUser } from "@/types";

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

/**
 * Hook that progressively fetches user data in batches without caching
 * @param userIds - Array of user IDs to fetch
 * @param options - Configuration options
 * @returns User data that progressively updates as batches complete
 */
export function useBatchUserData(
  userIds: string[],
  options: UseBatchUserDataOptions = {},
): UseBatchUserDataResult {
  const { enabled = true } = options;

  // Create stable key for userIds to detect changes
  const userIdsKey = useMemo(() => userIds.join(","), [userIds]);

  const [state, setState] = useState({
    robloxUsers: {} as Record<string, RobloxUser>,
    isLoading: false,
    loadedBatches: 0,
    userIdsKey: userIdsKey,
  });

  const hasFetchedRef = useRef(false);

  // Fetch all user IDs in a single batch for V2 API
  const batches = useMemo(() => {
    // V2 API supports fetching all users at once
    return [userIds];
  }, [userIds]);

  const totalBatches = batches.length;

  // Reset when user IDs change
  if (userIdsKey !== state.userIdsKey) {
    setState({
      robloxUsers: {},
      isLoading: enabled && totalBatches > 0,
      loadedBatches: 0,
      userIdsKey: userIdsKey,
    });
    hasFetchedRef.current = false;
  }

  // Fetch ALL batches in parallel (now just one)
  useEffect(() => {
    if (!enabled || totalBatches === 0 || hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    let completedBatches = 0;

    // Fire off request to proxy (now single batch)
    batches.forEach((batch, batchIndex) => {
      const proxyUrl = `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/proxy/users/v2`;

      fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "JailbreakChangelogs-InventoryChecker/1.0",
          "X-Source": process.env.NEXT_PUBLIC_INVENTORY_API_SOURCE_HEADER ?? "",
        },
        body: JSON.stringify({
          userIds: batch.map(Number),
        }),
      })
        .then((response) => response.json())
        .then((data: Record<string, RobloxUser> | { data: unknown }) => {
          // Handle both response formats
          let userData: Record<string, RobloxUser>;

          if (data && "data" in data && Array.isArray(data.data)) {
            // If wrapped in data array
            userData = {};
            data.data.forEach((item: unknown) => {
              if (item && typeof item === "object") {
                Object.assign(userData, item);
              }
            });
          } else if (data && typeof data === "object") {
            // If it's the user data object directly
            userData = data as Record<string, RobloxUser>;
          } else {
            userData = {};
          }

          if (Object.keys(userData).length > 0) {
            completedBatches++;

            // Update state as each batch completes
            setState((prev) => ({
              ...prev,
              robloxUsers: {
                ...prev.robloxUsers,
                ...userData,
              },
              loadedBatches: completedBatches,
              isLoading: completedBatches < totalBatches,
            }));
          }
        })
        .catch((error: Error) => {
          console.error(`Failed to fetch batch ${batchIndex}:`, error);
          completedBatches++;

          // Update progress even on error
          setState((prev) => ({
            ...prev,
            loadedBatches: completedBatches,
            isLoading: completedBatches < totalBatches,
          }));
        });
    });
  }, [enabled, totalBatches, batches]);

  return {
    robloxUsers: state.robloxUsers,
    isLoading: state.isLoading && enabled,
    progress: {
      loaded: state.loadedBatches,
      total: totalBatches,
    },
  };
}
