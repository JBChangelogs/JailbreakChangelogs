"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_API_URL, INVENTORY_WS_URL } from "@/utils/api";

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
  isConnecting: boolean;
  isIdle: boolean;
  error: string | undefined;
  requiresManualReconnect: boolean;
  isBanned: boolean;
  banRemainingSeconds: number | null;
  reconnect: () => void;
  reconnectFromBan: () => void;
  checkBanStatus: () => Promise<void>;
}

export function useRobberyTrackerAirdropsWebSocket(
  enabled: boolean = true,
  userId?: string | null,
): UseRobberyTrackerAirdropsWebSocketReturn {
  const [airdrops, setAirdrops] = useState<AirdropData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [requiresManualReconnect, setRequiresManualReconnect] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banRemainingSeconds, setBanRemainingSeconds] = useState<number | null>(
    null,
  );

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const connectRef = useRef<(() => void) | null>(null);
  const requiresManualReconnectRef = useRef(false);
  const isBannedRef = useRef(false);

  // Calculate exponential backoff delay
  const getReconnectDelay = (attempt: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const baseDelay = 1000;
    const maxDelay = 16000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return delay;
  };

  const connect = useCallback(
    (force: boolean = false) => {
      if (!enabled) return;

      if (
        (requiresManualReconnectRef.current || isBannedRef.current) &&
        !force
      ) {
        return;
      }

      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      try {
        const wsUrl = `${INVENTORY_WS_URL}/tracker?type=airdrops`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.addEventListener("open", () => {
          setIsConnected(true);
          setIsConnecting(false);
          setIsIdle(false);
          setError(undefined);
          setRequiresManualReconnect(false);
          requiresManualReconnectRef.current = false;
          setIsBanned(false);
          setBanRemainingSeconds(null);
          isBannedRef.current = false;
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
          setIsConnected(false);
          setIsConnecting(false);

          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          if (event.code === 4004) {
            const reason = event.reason || "";
            const match = reason.match(/remaining seconds:\s*(\d+)/i);
            const remaining = match ? Number(match[1]) : null;
            setIsBanned(true);
            setBanRemainingSeconds(
              Number.isFinite(remaining) ? remaining : null,
            );
            isBannedRef.current = true;
            setError("You have been banned from using the tracker.");
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            return;
          }

          if (event.code === 4005) {
            setRequiresManualReconnect(true);
            requiresManualReconnectRef.current = true;
            setError("Connected from another device/tab");
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            return;
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
          console.error("[AIRDROP TRACKER WS] Error:", err);
          setError("Connection error");
          setIsConnected(false);
        });
      } catch (err) {
        console.error("[AIRDROP TRACKER WS] Connection error:", err);
        setError("Connection error");
      }
    },
    [enabled],
  );

  const reconnect = useCallback(() => {
    if (!enabled) return;
    setRequiresManualReconnect(false);
    requiresManualReconnectRef.current = false;
    setError(undefined);
    reconnectAttemptsRef.current = 0;
    setIsConnecting(true);
    connect(true);
  }, [connect, enabled]);

  const reconnectFromBan = useCallback(() => {
    if (!enabled) return;
    setIsBanned(false);
    setBanRemainingSeconds(null);
    isBannedRef.current = false;
    setError(undefined);
    reconnectAttemptsRef.current = 0;
    setIsConnecting(true);
    connect(true);
  }, [connect, enabled]);

  const checkBanStatus = useCallback(async () => {
    if (!userId || !INVENTORY_API_URL) return;
    try {
      const response = await fetch(
        `${INVENTORY_API_URL}/tracker/ban?user_id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("Ban status check failed");
      }
      const data = (await response.json()) as {
        user_id: string | number;
        banned: boolean;
        remaining_seconds: number;
      };

      if (data.banned) {
        setIsBanned(true);
        setBanRemainingSeconds(
          Number.isFinite(data.remaining_seconds)
            ? data.remaining_seconds
            : null,
        );
        isBannedRef.current = true;
      } else {
        setIsBanned(false);
        setBanRemainingSeconds(null);
        isBannedRef.current = false;
        setError(undefined);
        setIsConnecting(true);
        connect(true);
      }
    } catch (err) {
      console.error("[AIRDROP TRACKER WS] Ban status check error:", err);
      setError("Failed to check ban status");
    }
  }, [connect, userId]);

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
        if (!requiresManualReconnectRef.current && !isBannedRef.current) {
          setIsConnecting(true);
          connect();
        }
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
        if (!requiresManualReconnectRef.current && !isBannedRef.current) {
          setIsConnecting(true);
          connect();
        } else {
          setIsConnecting(false);
        }
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
      if (
        !document.hidden &&
        !requiresManualReconnectRef.current &&
        !isBannedRef.current
      ) {
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
    isConnecting,
    isIdle,
    error,
    requiresManualReconnect,
    isBanned,
    banRemainingSeconds,
    reconnect,
    reconnectFromBan,
    checkBanStatus,
  };
}
