"use client";

import { useState, useEffect, useRef } from "react";
import { formatRelativeDate } from "@/utils/timestamp";

/**
 * React hook for real-time relative timestamp updates
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @returns Real-time updating relative time string
 */
export const useRealTimeRelativeDate = (
  timestamp: string | number | null | undefined,
) => {
  const [, setTick] = useState(() => Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    if (!timestamp) {
      return;
    }

    const updateTick = () => {
      // Only update if the component is visible
      if (isVisibleRef.current) {
        setTick(Date.now());
      }
    };

    // Handle visibility changes to pause updates when not visible
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        // Update immediately when becoming visible
        updateTick();
      }
    };

    // Set up interval for updates
    intervalRef.current = setInterval(updateTick, 1000);

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timestamp]);

  if (!timestamp) {
    return "";
  }

  return formatRelativeDate(timestamp);
};
