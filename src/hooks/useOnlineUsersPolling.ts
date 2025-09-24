"use client";

import { useState, useEffect, useCallback } from "react";
import { pollOnlineUsers } from "@/app/api/users/actions";
import { OnlineUser } from "@/utils/api";

interface OnlineUsersPollingData {
  onlineUsers: OnlineUser[] | null;
  lastUpdated: number;
  error: string | null;
  isLoading: boolean;
  retryCount: number;
  consecutiveEmptyResults: number;
  pollingStopped: boolean;
}

export function useOnlineUsersPolling(intervalMs: number = 30000) {
  const [data, setData] = useState<OnlineUsersPollingData>({
    onlineUsers: null,
    lastUpdated: 0,
    error: null,
    isLoading: true,
    retryCount: 0,
    consecutiveEmptyResults: 0,
    pollingStopped: false,
  });

  const fetchData = useCallback(async () => {
    // Set loading state
    setData((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await pollOnlineUsers();

      if (result.success && result.data) {
        setData({
          onlineUsers: result.data,
          lastUpdated: Date.now(),
          error: null,
          isLoading: false,
          retryCount: 0,
          consecutiveEmptyResults: 0,
          pollingStopped: false,
        });
      } else {
        setData((prev) => ({
          ...prev,
          error: result.error || "Unknown error",
          isLoading: false,
          retryCount: prev.retryCount + 1,
        }));
      }
    } catch {
      setData((prev) => ({
        ...prev,
        error: "Network error",
        isLoading: false,
        retryCount: prev.retryCount + 1,
      }));
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling interval
    const interval = setInterval(fetchData, intervalMs);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return {
    onlineUsers: data.onlineUsers,
    lastUpdated: data.lastUpdated,
    error: data.error,
    isLoading: data.isLoading,
    retryCount: data.retryCount,
    pollingStopped: data.pollingStopped,
  };
}
