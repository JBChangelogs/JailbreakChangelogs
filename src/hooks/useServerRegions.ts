"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { INVENTORY_API_URL } from "@/utils/api/api";
import { ServerRegionData } from "./useRobberyTrackerWebSocket";
import { createLogger } from "@/services/logger";

const log = createLogger("WS");

/** Fetch region metadata in batches of up to 100 IDs. */
export function useServerRegions() {
  const queryClient = useQueryClient();
  const fetchRegionData = useCallback(
    async (
      regionIds: string[],
    ): Promise<Record<string, ServerRegionData | null>> => {
      const validIds = [...new Set(regionIds.filter(Boolean))];
      if (validIds.length === 0) return {};

      const batches: string[][] = [];
      for (let index = 0; index < validIds.length; index += 100) {
        batches.push(validIds.slice(index, index + 100));
      }

      const results = await Promise.all(
        batches.map(async (batch) => {
          try {
            return await queryClient.fetchQuery({
              queryKey: ["server-regions", [...batch].sort()],
              queryFn: async ({
                signal,
              }): Promise<Record<string, ServerRegionData | null>> => {
                const idsParam = batch.map(encodeURIComponent).join(",");
                const response = await fetch(
                  `${INVENTORY_API_URL}/servers/regions?ids=${idsParam}`,
                  { signal },
                );
                if (!response.ok) {
                  const body = await response.json().catch(() => ({}));
                  log.error("[REGION FETCH] Failed to fetch regions", {
                    status: response.status,
                    body,
                  });
                  throw new Error(`Region request failed (${response.status})`);
                }
                return response.json();
              },
              staleTime: 5 * 60_000,
              gcTime: 30 * 60_000,
              retry: false,
            });
          } catch (error) {
            log.error("[REGION FETCH] Error fetching regions", error);
            return Object.fromEntries(batch.map((id) => [id, null]));
          }
        }),
      );
      return Object.assign({}, ...results);
    },
    [queryClient],
  );

  return { fetchRegionData };
}
