"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_WS_URL } from "@/utils/api";

/**
 * WebSocket hook for tracking airdrop status
 * Connects to /tracker?type=airdrops endpoint and receives real-time airdrop updates
 */

export interface AirdropData {
  location: "CactusValley" | "Dunes";
  color: "Brown" | "Blue" | "Red";
  x: number;
  z: number;
  gone_at: number;
  server_time: number;
  timestamp: number;
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

interface UseRobberyTrackerAirdropsWebSocketReturn {
  airdrops: AirdropData[];
  isConnected: boolean;
  error: string | undefined;
}

export function useRobberyTrackerAirdropsWebSocket(
  enabled: boolean = true,
): UseRobberyTrackerAirdropsWebSocketReturn {
  const [airdrops, setAirdrops] = useState<AirdropData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
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
      const wsUrl = `${INVENTORY_WS_URL}/tracker?type=airdrops`;
      console.log("[AIRDROP TRACKER WS] Connecting to:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        console.log("[AIRDROP TRACKER WS] Connected");
        setIsConnected(true);
        setError(undefined);
        reconnectAttemptsRef.current = 0;

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ action: "ping" }));
            } catch (err) {
              console.error("[AIRDROP TRACKER WS] Ping send failed:", err);
            }
          }
        }, 30000); // Ping every 30 seconds
      });

      ws.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          // Action map handling for airdrops
          if (data.action === "recent_airdrops" && data.data) {
            setAirdrops(data.data);
          }
        } catch (err) {
          console.error("[AIRDROP TRACKER WS] Parse error:", err);
          setError("Failed to parse server response");
        }
      });

      ws.addEventListener("close", (event) => {
        console.log("[AIRDROP TRACKER WS] Closed:", event.code, event.reason);
        setIsConnected(false);

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
            console.log(
              `[AIRDROP TRACKER WS] Reconnecting in ${delay}ms... (${reconnectAttemptsRef.current}/${maxAttempts})`,
            );

            reconnectTimeoutRef.current = setTimeout(() => {
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
        console.error("[AIRDROP TRACKER WS] Error:", err);
        setError("Connection error");
        setIsConnected(false);
      });
    } catch (err) {
      console.error("[AIRDROP TRACKER WS] Connection error:", err);
      setError("Connection error");
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log("[AIRDROP TRACKER WS] Disconnecting (Idle/Hidden/Unmount)");
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
        console.log("[AIRDROP TRACKER WS] User active - reconnecting");
        connect();
      }

      // Set new timeout
      idleTimeoutRef.current = setTimeout(() => {
        console.log("[AIRDROP TRACKER WS] User idle - disconnecting");
        isIdleRef.current = true;
        disconnect();
      }, IDLE_TIMEOUT);
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("[AIRDROP TRACKER WS] Tab hidden - disconnecting");
        isVisibleRef.current = false;
        disconnect();
        // Clear idle timer when tab is hidden
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
      } else {
        console.log("[AIRDROP TRACKER WS] Tab visible - reconnecting");
        isVisibleRef.current = true;
        isIdleRef.current = false;
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
    airdrops,
    isConnected,
    error,
  };
}
