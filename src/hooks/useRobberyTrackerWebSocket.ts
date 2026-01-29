"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_WS_URL } from "@/utils/api";

/**
 * WebSocket hook for tracking robbery status
 * Connects to /tracker endpoint and receives real-time robbery updates
 */

export interface ServerRegionData {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export interface RobberyData {
  marker_name: string;
  name: string;
  status: number;
  progress: number | null;
  metadata: {
    casino_code?: string;
    plane_time?: number;
    casino_time?: number;
  } | null;
  job_id: string;
  server_time: number;
  timestamp: number;
  region_id?: string;
  region_data?: ServerRegionData;
  server?: {
    job_id: string;
    server_time: number;
    timestamp: number;
    bot_id: number;
    players: {
      user_id: string;
      username: string | null;
      team: string;
      level: number;
      has_season_pass: boolean;
      money: number;
      xp: number;
      gamepasses: string[];
    }[];
  };
}

interface UseRobberyTrackerWebSocketReturn {
  robberies: RobberyData[];
  isConnected: boolean;
  isConnecting: boolean;
  isIdle: boolean;
  error: string | undefined;
}

export function useRobberyTrackerWebSocket(
  enabled: boolean = true,
): UseRobberyTrackerWebSocketReturn {
  const [robberies, setRobberies] = useState<RobberyData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const connectRef = useRef<(() => void) | null>(null);

  // Calculate exponential backoff delay
  const getReconnectDelay = (attempt: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const baseDelay = 1000;
    const maxDelay = 16000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return delay;
  };

  const connect = useCallback(() => {
    if (!enabled) return;

    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    try {
      const wsUrl = `${INVENTORY_WS_URL}/tracker`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setIsConnected(true);
        setIsConnecting(false);
        setIsIdle(false);
        setError(undefined);
        reconnectAttemptsRef.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ action: "ping" }));
            } catch (err) {
              console.error("[ROBBERY TRACKER WS] Ping send failed:", err);
            }
          }
        }, 30000); // Ping every 30 seconds
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          // Action map handling
          if (data.action === "recent_robberies" && data.data) {
            setRobberies(data.data);
          }
        } catch (err) {
          console.error("[ROBBERY TRACKER WS] Parse error:", err);
          setError("Failed to parse server response");
        }
      });

      ws.addEventListener("close", (event) => {
        setIsConnected(false);
        setIsConnecting(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Only auto-reconnect if not intentionally closed (idle/hidden/unmount)
        // 1000 = Normal Closure
        if (
          enabled &&
          event.code !== 1000 &&
          !isIdleRef.current &&
          isVisibleRef.current
        ) {
          const maxAttempts = 5;
          if (reconnectAttemptsRef.current < maxAttempts) {
            reconnectAttemptsRef.current++;
            const delay = getReconnectDelay(reconnectAttemptsRef.current);

            reconnectTimeoutRef.current = setTimeout(() => {
              setIsConnecting(true);
              connectRef.current?.();
            }, delay);
          } else {
            setError(
              "Connection lost. Unable to reconnect after multiple attempts. Please refresh your browser to reconnect.",
            );
          }
        }
      });

      ws.addEventListener("error", (err) => {
        console.error("[ROBBERY TRACKER WS] Error:", err);
        setError("Connection error");
        setIsConnected(false);
      });
    } catch (err) {
      console.error("[ROBBERY TRACKER WS] Connection error:", err);
      setError("Connection error");
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setError(undefined);
    // Data is persisted to avoid flashing empty state on reconnect
  }, []);

  // Refs for state tracking without re-renders
  const isIdleRef = useRef(false);
  const isVisibleRef = useRef(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Handle idle and visibility
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const IDLE_TIMEOUT = 3 * 60 * 1000; // 3 minutes

    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      // If user was idle, they are now active
      if (isIdleRef.current) {
        isIdleRef.current = false;
        setIsIdle(false);
        setIsConnecting(true);
        connect();
      }

      // Set new timeout
      idleTimeoutRef.current = setTimeout(() => {
        isIdleRef.current = true;
        setIsIdle(true);
        disconnect();
      }, IDLE_TIMEOUT);
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        setIsIdle(true);
        disconnect();
        // Clear idle timer when tab is hidden
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
      } else {
        isVisibleRef.current = true;
        isIdleRef.current = false;
        setIsConnecting(true);
        connect();
        // Restart idle timer when tab becomes visible
        resetIdleTimer();
      }
    };

    // Initial timer setup
    resetIdleTimer();

    // Activity listeners (only reset timer if tab is visible)
    const resetIdleTimerIfVisible = () => {
      if (!document.hidden) {
        resetIdleTimer();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) =>
      document.addEventListener(event, resetIdleTimerIfVisible),
    );

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Connect initially (wrapped to avoid synchronous state update warning)
    const initialConnectTimer = setTimeout(() => {
      if (!document.hidden) {
        connect();
      }
    }, 0);

    return () => {
      clearTimeout(initialConnectTimer);
      events.forEach((event) =>
        document.removeEventListener(event, resetIdleTimerIfVisible),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    robberies,
    isConnected,
    isConnecting,
    isIdle,
    error,
  };
}
