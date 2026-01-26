"use client";

import { useRef, useCallback } from "react";
import { INVENTORY_API_URL } from "@/utils/api";
import { ServerRegionData } from "./useRobberyTrackerWebSocket";

/**
 * Hook to fetch server region data without persistent caching
 * Deduplicates concurrent requests for the same region ID
 */
export function useServerRegions() {
  // Set of region IDs currently being fetched to prevent duplicate concurrent requests
  const fetchingRef = useRef<Set<string>>(new Set());

  const fetchRegionData = useCallback(
    async (regionId: string): Promise<ServerRegionData | null> => {
      if (!regionId) return null;

      // Skip if already fetching this region (prevent concurrent duplicates)
      if (fetchingRef.current.has(regionId)) {
        // Wait for the in-flight request to complete by polling
        return new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!fetchingRef.current.has(regionId)) {
              clearInterval(checkInterval);
              resolve(null); // Return null since component handles its own state
            }
          }, 50);
        });
      }

      try {
        fetchingRef.current.add(regionId);

        const url = `${INVENTORY_API_URL}/server/region?id=${encodeURIComponent(regionId)}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.error(
            `[REGION FETCH] Failed to fetch region ${regionId}:`,
            response.status,
          );
          return null;
        }

        const data = (await response.json()) as ServerRegionData;

        console.log(`[REGION FETCH] Fetched region ${regionId}`);
        return data;
      } catch (error) {
        console.error(
          `[REGION FETCH] Error fetching region ${regionId}:`,
          error,
        );
        return null;
      } finally {
        fetchingRef.current.delete(regionId);
      }
    },
    [],
  );

  return {
    fetchRegionData,
  };
}
