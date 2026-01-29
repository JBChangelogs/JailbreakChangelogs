"use client";

import { useState, useEffect, useCallback } from "react";
import { pollBotsData } from "@/app/api/bots/actions";
import { type ConnectedBotsResponse, type QueueInfo } from "@/utils/api";

interface BotsPollingData {
  botsData: ConnectedBotsResponse | null;
  queueInfo: QueueInfo | null;
  lastUpdated: number;
  error: string | null;
  isLoading: boolean;
  retryCount: number;
  consecutiveEmptyResults: number;
  pollingStopped: boolean;
}

export function useBotsPolling(intervalMs: number = 30000) {
  const [data, setData] = useState<BotsPollingData>({
    botsData: null,
    queueInfo: null,
    lastUpdated: 0,
    error: null,
    isLoading: true,
    retryCount: 0,
    consecutiveEmptyResults: 0,
    pollingStopped: false,
  });

  const fetchData = useCallback(async () => {
    const timestamp = new Date().toISOString();

    // Set loading state
    setData((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await pollBotsData();

      if (result.success && result.data) {
        const totalBotsCount =
          result.data.botsData?.recent_heartbeats?.length || 0;

        setData({
          botsData: result.data.botsData,
          queueInfo: result.data.queueInfo,
          lastUpdated: Date.now(),
          error: null,
          isLoading: false,
          retryCount: 0,
          consecutiveEmptyResults: 0,
          pollingStopped: false,
        });
      } else {
        console.error(
          `[POLLING] Failed to fetch data at ${timestamp}:`,
          result.error,
        );
        setData((prev) => ({
          ...prev,
          error: result.error || "Unknown error",
          isLoading: false,
          retryCount: prev.retryCount + 1,
        }));
      }
    } catch (error) {
      console.error(`[POLLING] Network error at ${timestamp}:`, error);
      setData((prev) => ({
        ...prev,
        error: "Network error",
        isLoading: false,
        retryCount: prev.retryCount + 1,
      }));
    }
  }, []);

  useEffect(() => {
    // Initial fetch - wrap in setTimeout to avoid synchronous setState
    const initialTimeout = setTimeout(fetchData, 0);

    // Set up polling interval
    const interval = setInterval(fetchData, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fetchData, intervalMs]);

  // Auto-retry on error
  useEffect(() => {
    if (data.error && data.retryCount < 3) {
      const retryTimeout = setTimeout(() => {
        fetchData();
      }, 5000);

      return () => clearTimeout(retryTimeout);
    }
  }, [data.error, data.retryCount, fetchData]);

  return {
    ...data,
    refetch: fetchData,
  };
}
