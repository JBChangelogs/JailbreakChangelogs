"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_WS_URL, ENABLE_WS_SCAN } from "@/utils/api";
import type { ScanPhase } from "@/utils/scanProgressMessage";

/**
 * WebSocket hook for managing inventory scan operations
 * Handles connection, retry logic, and UI state management
 */

interface ScanStatus {
  status:
    | "idle"
    | "connecting"
    | "connected"
    | "scanning"
    | "completed"
    | "error";
  message?: string;
  progress?: number;
  error?: string;
  expiresAt?: number;
}

interface UseScanWebSocketReturn {
  status: ScanStatus["status"];
  phase: ScanPhase | undefined;
  message: string | undefined;
  progress: number | undefined;
  error: string | undefined;
  expiresAt: number | undefined;
  isConnected: boolean;
  startScan: (turnstileToken?: string) => void;
  stopScan: () => void;
  forceShowError: boolean;
  resetForceShowError: () => void;
}

export function useScanWebSocket(userId: string): UseScanWebSocketReturn {
  const [status, setStatus] = useState<ScanStatus["status"]>("idle");
  const [phase, setPhase] = useState<ScanPhase | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [expiresAt, setExpiresAt] = useState<number | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [forceShowError, setForceShowError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanningLongWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const connectRef = useRef<(() => void) | null>(null);

  const connectionQualityRef = useRef<{
    messagesReceived: number;
    lastMessageTime: number;
    connectionStartTime: number;
    compressionEnabled: boolean;
  }>({
    messagesReceived: 0,
    lastMessageTime: 0,
    connectionStartTime: 0,
    compressionEnabled: false,
  });

  const clearScanTimers = useCallback(() => {
    if (scanningTimeoutRef.current) {
      clearTimeout(scanningTimeoutRef.current);
      scanningTimeoutRef.current = null;
    }

    if (scanningLongWaitTimeoutRef.current) {
      clearTimeout(scanningLongWaitTimeoutRef.current);
      scanningLongWaitTimeoutRef.current = null;
    }
  }, []);

  const startScanTimers = useCallback(() => {
    clearScanTimers();

    scanningLongWaitTimeoutRef.current = setTimeout(() => {
      setMessage(
        "Scanning is taking a bit longer than usual. Thanks for your patience.",
      );
      setProgress(undefined);
      setPhase("scanning");
    }, 120000); // 2 minutes

    scanningTimeoutRef.current = setTimeout(() => {
      setError(
        "This scan took too long to complete. Please try again in a moment.",
      );
      setStatus("error");
      setPhase("error");

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    }, 180000); // 3 minutes
  }, [clearScanTimers]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus("connecting");
    setPhase("connecting");
    setError(undefined);

    try {
      // Include Turnstile token in WebSocket URL if available
      let wsUrl = `${INVENTORY_WS_URL}/scan?user_id=${userId}`;
      if (turnstileToken) {
        wsUrl += `&turnstile_token=${encodeURIComponent(turnstileToken)}`;
      }

      const ws = new WebSocket(wsUrl);

      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setStatus("connected");
        setIsConnected(true);
        setError(undefined);
        reconnectAttemptsRef.current = 0;

        connectionQualityRef.current = {
          messagesReceived: 0,
          lastMessageTime: Date.now(),
          connectionStartTime: Date.now(),
          compressionEnabled:
            ws.extensions?.includes("permessage-deflate") || false,
        };

        ws.send(JSON.stringify({ action: "request" }));
        setStatus("scanning");
        setPhase("requested");
        startScanTimers();

        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              const heartbeatMsg = JSON.stringify({
                action: "status",
                timestamp: Date.now(),
              });
              wsRef.current.send(heartbeatMsg);
            } catch (err) {
              console.error("[SCAN WS] Status check send failed:", err);
            }
          }
        }, 30000);
      });

      ws.addEventListener("message", (event) => {
        try {
          const messageData = event.data;
          const isCompressed = event.data instanceof ArrayBuffer;

          connectionQualityRef.current.messagesReceived++;
          connectionQualityRef.current.lastMessageTime = Date.now();

          let data;
          if (isCompressed) {
            const decoder = new TextDecoder();
            data = JSON.parse(decoder.decode(messageData));
          } else {
            data = JSON.parse(messageData);
          }

          // If attempt exceeds total_attempts, use attempt as the max to show accurate progress
          if (data.error && data.attempt && data.total_attempts) {
            setStatus("scanning");
            setPhase("retrying");
            const maxAttempts = Math.max(data.attempt, data.total_attempts, 15);
            setMessage(
              `${data.error} - Retrying (${data.attempt}/${maxAttempts})`,
            );
            setProgress(5);
            return;
          }

          if (data.error) {
            setError(data.error);
            setExpiresAt(data.expires_at || undefined);
            setStatus("error");
            setPhase("error");
            return;
          }

          setError(undefined);
          setExpiresAt(undefined);

          if (data.action === "request_response") {
            setStatus("scanning");
            setPhase("requested");
            setMessage(data.status || "Scan requested successfully");
            setProgress(10);

            if (scanningTimeoutRef.current) {
              startScanTimers();
            }
          } else if (data.action === "update") {
            setStatus("scanning");
            setPhase("scanning");
            setMessage(data.message || "Scanning in progress...");

            if (
              data.message &&
              data.message.toLowerCase().includes("not found")
            ) {
              setMessage(
                "User not found in game. Please join a trade server and try again.",
              );
              setProgress(undefined);
              setError(
                "User not found in game. Please join a trade server and try again.",
              );
              setStatus("error");
              setPhase("failed_not_in_server");

              setTimeout(() => {
                if (
                  wsRef.current &&
                  wsRef.current.readyState === WebSocket.OPEN
                ) {
                  wsRef.current.close();
                  setStatus("idle");
                  setMessage(undefined);
                  setProgress(undefined);
                  setError(undefined);
                }
              }, 2000);
            } else if (
              data.message &&
              data.message.toLowerCase().includes("user found")
            ) {
              setMessage(data.message);
              setProgress(50);
              setPhase("user_found");

              if (scanningTimeoutRef.current) {
                startScanTimers();
              }
            } else if (
              data.message &&
              data.message.toLowerCase().includes("bot joined server")
            ) {
              setMessage(data.message);
              setProgress(75);
              setPhase("bot_joined");

              if (scanningTimeoutRef.current) {
                startScanTimers();
              }
            } else if (
              data.message &&
              data.message.toLowerCase().includes("added to queue")
            ) {
              const queueMessage = data.message;
              const positionMatch = queueMessage.match(/Position: (\d+)/);

              let formattedMessage = queueMessage;
              if (positionMatch) {
                const position = parseInt(positionMatch[1]);
                formattedMessage = `Added to queue - Position ${position}`;
              }

              setMessage(formattedMessage);
              setProgress(100);
              setStatus("completed");
              setPhase("queued");

              setTimeout(() => {
                if (wsRef.current) {
                  wsRef.current.close();
                  setStatus("idle");
                  setMessage(undefined);
                  setProgress(undefined);
                  setError(undefined);
                }
              }, 5000);
            } else {
              if (data.data && data.data.position) {
                const position = data.data.position;
                if (position === 1) {
                  setProgress(60);
                  setMessage("Currently being scanned...");
                  setPhase("scanning");
                } else {
                  setProgress(40);
                  setMessage(`Position ${position} in queue`);
                  setPhase("queued");
                }
              }
            }
          } else if (data.action === "status") {
            setStatus(data.status || "scanning");
            if (data.status === "completed" || data.completed) {
              setPhase("completed");
            } else if (data.status === "error") {
              setPhase("error");
            }
            if (typeof data.message === "string" && data.message.trim()) {
              setMessage(data.message);
            }
            return;
          }

          if (data.status === "completed" || data.completed) {
            setStatus("completed");
            setPhase("completed");
            setProgress(100);
            setMessage("Scan completed successfully!");

            if (scanningTimeoutRef.current) {
              clearScanTimers();
            }
          }
        } catch (err) {
          console.error("[SCAN WS] Parse error:", err);
          setError("Invalid response from server - connection may be unstable");
          setStatus("error");
        }
      });

      ws.addEventListener("close", (event) => {
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        clearScanTimers();

        if (
          status === "scanning" &&
          event.code !== 1000 &&
          event.code !== 1001
        ) {
          if (!event.reason || event.reason.trim() === "") {
            if (reconnectAttemptsRef.current < 2) {
              reconnectAttemptsRef.current++;

              setMessage(`Reconnecting... (${reconnectAttemptsRef.current}/2)`);
              setPhase("retrying");

              reconnectTimeoutRef.current = setTimeout(() => {
                connectRef.current?.();
              }, 3000);
            } else {
              setError("Connection lost - please try again");
              setStatus("error");
              setPhase("error");
            }
          } else {
            setError(`Connection closed: ${event.reason}`);
            setStatus("error");
            setPhase("error");
          }
        } else if (
          status !== "completed" &&
          status !== "error" &&
          status !== "idle"
        ) {
          setError("Connection lost");
          setStatus("error");
          setPhase("error");
        }
      });

      ws.addEventListener("error", (err) => {
        console.error("[SCAN WS] Error:", err);
        setError("WebSocket connection error");
        setStatus("error");
        setPhase("error");
        setIsConnected(false);
      });
    } catch (err) {
      console.error("[SCAN WS] Connection error:", err);
      setError("Failed to connect to scan service");
      setStatus("error");
      setPhase("error");
    }
  }, [userId, status, turnstileToken, clearScanTimers, startScanTimers]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const startScan = useCallback(
    (token?: string) => {
      if (!userId) {
        setError("No user ID provided");
        setStatus("error");
        setPhase("error");
        return;
      }

      if (!ENABLE_WS_SCAN) {
        setError("Inventory scanning is temporarily disabled");
        setStatus("error");
        setPhase("error");
        setForceShowError(true); // Force error display on next render
        return;
      }

      // Store the token for use in connection
      if (token) {
        setTurnstileToken(token);
      }

      connect();
    },
    [userId, connect],
  );

  const stopScan = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    clearScanTimers();

    reconnectAttemptsRef.current = 0;
    setStatus("idle");
    setPhase(undefined);
    setIsConnected(false);
    setMessage(undefined);
    setProgress(undefined);
    setError(undefined);
    setExpiresAt(undefined);
  }, [clearScanTimers]);

  const resetForceShowError = useCallback(() => {
    setForceShowError(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  return {
    status,
    phase,
    message,
    progress,
    error,
    expiresAt,
    isConnected,
    startScan,
    stopScan,
    forceShowError,
    resetForceShowError,
  };
}
