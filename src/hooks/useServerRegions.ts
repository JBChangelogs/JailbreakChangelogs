"use client";

import { useRef, useCallback } from "react";
import { INVENTORY_API_URL } from "@/utils/api";
import { ServerRegionData } from "./useRobberyTrackerWebSocket";

/**
 * Hook to fetch server region data in batches without persistent caching
 * Deduplicates concurrent requests for the same region IDs
 * Supports batch fetching of up to 100 region IDs in a single request
 */
export function useServerRegions() {
  // Set of region IDs currently being fetched to prevent duplicate concurrent requests
  const fetchingRef = useRef<Set<string>>(new Set());

  const fetchRegionData = useCallback(
    async (
      regionIds: string[],
    ): Promise<Record<string, ServerRegionData | null>> => {
      if (!regionIds || regionIds.length === 0) return {};

      // Filter out empty IDs
      const validIds = regionIds.filter((id) => id);
      if (validIds.length === 0) return {};

      // Check for already fetching IDs and wait for them
      const alreadyFetching = validIds.filter((id) =>
        fetchingRef.current.has(id),
      );
      if (alreadyFetching.length > 0) {
        // Wait for in-flight requests to complete by polling
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            const stillFetching = alreadyFetching.some((id) =>
              fetchingRef.current.has(id),
            );
            if (!stillFetching) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 50);
        });
      }

      try {
        // Mark all IDs as fetching
        validIds.forEach((id) => fetchingRef.current.add(id));

        // Split into batches of up to 100 IDs per request
        const batchSize = 100;
        const batches = [];
        for (let i = 0; i < validIds.length; i += batchSize) {
          batches.push(validIds.slice(i, i + batchSize));
        }

        const allResults: Record<string, ServerRegionData | null> = {};

        for (const batch of batches) {
          const idsParam = batch.map(encodeURIComponent).join(",");
          const url = `${INVENTORY_API_URL}/servers/regions?ids=${idsParam}`;

          const response = await fetch(url);

          if (!response.ok) {
            console.error(
              `[REGION FETCH] Failed to fetch regions:`,
              response.status,
            );
            // Set null for all IDs in this batch on error
            batch.forEach((id) => {
              allResults[id] = null;
            });
            continue;
          }

          const data = (await response.json()) as Record<
            string,
            ServerRegionData | null
          >;
          Object.assign(allResults, data);
        }

        return allResults;
      } catch (error) {
        console.error(
          `[REGION FETCH] Error fetching regions (${validIds.join(", ")}):`,
          error,
        );
        // Return null for all requested IDs on error
        return Object.fromEntries(validIds.map((id) => [id, null]));
      } finally {
        validIds.forEach((id) => fetchingRef.current.delete(id));
      }
    },
    [],
  );

  return {
    fetchRegionData,
  };
}
