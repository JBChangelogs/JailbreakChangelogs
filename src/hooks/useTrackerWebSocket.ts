"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_API_URL, INVENTORY_WS_URL } from "@/utils/api/api";
import { buildApiWsUrl } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";

const log = createLogger("WS");

const PING_MSG = JSON.stringify({ action: "ping" });
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL_MS = 30_000;
const IDLE_TIMEOUT_MS = 3 * 60 * 1000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 16_000;

function getReconnectDelay(attempt: number): number {
  return Math.min(
    RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt - 1),
    RECONNECT_MAX_DELAY_MS,
  );
}

interface TrackerWebSocketOptions {
  endpoint: string;
  messageAction: string;
  enabled: boolean;
  userId?: string | null;
  logPrefix: string;
}

export interface TrackerWebSocketReturn<TData> {
  data: TData[];
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

export function useTrackerWebSocket<TData = unknown>({
  endpoint,
  messageAction,
  enabled,
  userId,
  logPrefix,
}: TrackerWebSocketOptions): TrackerWebSocketReturn<TData> {
  const [data, setData] = useState<TData[]>([]);
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
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<(() => void) | null>(null);
  const requiresManualReconnectRef = useRef(false);
  const isBannedRef = useRef(false);
  const isIdleRef = useRef(false);
  const isVisibleRef = useRef(true);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  }, []);

  const connect = useCallback(
    (force = false) => {
      if (!enabled) return;
      if ((requiresManualReconnectRef.current || isBannedRef.current) && !force)
        return;
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      )
        return;

      try {
        const wsUrl = buildApiWsUrl(INVENTORY_WS_URL, endpoint, {
          tokenParamName: "token",
        });
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

          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              try {
                wsRef.current.send(PING_MSG);
              } catch (err) {
                log.error(`${logPrefix}: Ping send failed`, err);
              }
            }
          }, PING_INTERVAL_MS);
        });

        ws.addEventListener("message", (event) => {
          try {
            const msg = JSON.parse(event.data as string) as {
              action: string;
              data?: TData[];
            };
            if (msg.action === messageAction && msg.data) {
              setData(msg.data);
            }
          } catch (err) {
            log.error(`${logPrefix}: Parse error`, err);
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
            const match = (event.reason ?? "").match(
              /remaining seconds:\s*(\d+)/i,
            );
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

          if (
            enabled &&
            event.code !== 1000 &&
            !isIdleRef.current &&
            isVisibleRef.current
          ) {
            if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
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

        ws.addEventListener("error", (event) => {
          log.error(
            `${logPrefix}: Socket error`,
            (event.target as WebSocket)?.url,
          );
          setError("Connection error");
          setIsConnected(false);
        });
      } catch (err) {
        log.error(`${logPrefix}: Connection error`, err);
        setError("Connection error");
      }
    },
    [enabled, endpoint, messageAction, logPrefix],
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
        const body = await response.json().catch(() => ({}));
        log.error(`${logPrefix}: Ban status check failed`, {
          status: response.status,
          body,
        });
        throw new Error("Ban status check failed");
      }
      const result = (await response.json()) as {
        user_id: string | number;
        banned: boolean;
        remaining_seconds: number;
      };

      if (result.banned) {
        setIsBanned(true);
        setBanRemainingSeconds(
          Number.isFinite(result.remaining_seconds)
            ? result.remaining_seconds
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
      log.error(`${logPrefix}: Ban status check error`, err);
      setError("Failed to check ban status");
    }
  }, [connect, userId, logPrefix]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!enabled) return;

    const resetIdleTimer = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

      if (isIdleRef.current) {
        isIdleRef.current = false;
        setIsIdle(false);
        if (!requiresManualReconnectRef.current && !isBannedRef.current) {
          setIsConnecting(true);
          connect();
        }
      }

      idleTimeoutRef.current = setTimeout(() => {
        isIdleRef.current = true;
        setIsIdle(true);
        disconnect();
      }, IDLE_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        setIsIdle(true);
        disconnect();
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
        resetIdleTimer();
      }
    };

    resetIdleTimer();

    const resetIdleTimerIfVisible = () => {
      if (!document.hidden) resetIdleTimer();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) =>
      document.addEventListener(e, resetIdleTimerIfVisible),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

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
      events.forEach((e) =>
        document.removeEventListener(e, resetIdleTimerIfVisible),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      disconnect();
    };
  }, [connect, disconnect, enabled]);

  return {
    data,
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
