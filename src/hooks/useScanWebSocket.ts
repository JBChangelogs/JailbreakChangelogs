"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_WS_URL, ENABLE_WS_SCAN } from "@/utils/api";

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
  message: string | undefined;
  progress: number | undefined;
  error: string | undefined;
  expiresAt: number | undefined;
  isConnected: boolean;
  startScan: () => void;
  stopScan: () => void;
  forceShowError: boolean;
  resetForceShowError: () => void;
}

export function useScanWebSocket(userId: string): UseScanWebSocketReturn {
  const [status, setStatus] = useState<ScanStatus["status"]>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [expiresAt, setExpiresAt] = useState<number | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [forceShowError, setForceShowError] = useState(false);

  useEffect(() => {
    console.log("[SCAN WS] Status changed to:", status);
  }, [status]);

  useEffect(() => {
    console.log("[SCAN WS] Error changed to:", error);
  }, [error]);

  useEffect(() => {
    console.log("[SCAN WS] ForceShowError changed to:", forceShowError);
  }, [forceShowError]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

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

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus("connecting");
    setError(undefined);

    try {
      const wsUrl = `${INVENTORY_WS_URL}/scan?user_id=${userId}`;

      const ws = new WebSocket(wsUrl);

      wsRef.current = ws;

      ws.addEventListener("open", () => {
        console.log("[SCAN WS] Connected");
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

        console.log("[SCAN WS] Connection quality:", {
          compression: connectionQualityRef.current.compressionEnabled,
          extensions: ws.extensions,
        });

        ws.send(JSON.stringify({ action: "request" }));
        setStatus("scanning");

        // Start scanning timeout (1 minute)
        scanningTimeoutRef.current = setTimeout(() => {
          console.log(
            "[SCAN WS] Scanning timeout - no updates received for 1 minute",
          );
          setError("Scanning timeout - please try again");
          setStatus("error");

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }
        }, 60000); // 1 minute

        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              const heartbeatMsg = JSON.stringify({
                action: "status",
                timestamp: Date.now(),
              });
              wsRef.current.send(heartbeatMsg);
              console.log("[SCAN WS] Sent status check");
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
            console.log("[SCAN WS] Received compressed message:", data);
          } else {
            data = JSON.parse(messageData);
            console.log("[SCAN WS] Received:", data);
          }

          if (data.error && data.attempt && data.total_attempts) {
            setStatus("scanning");
            setMessage(
              `${data.error} - Retrying (${data.attempt}/${data.total_attempts})`,
            );
            setProgress(5);
            return;
          }

          if (data.error) {
            setError(data.error);
            setExpiresAt(data.expires_at || undefined);
            setStatus("error");
            return;
          }

          setError(undefined);
          setExpiresAt(undefined);

          if (data.action === "request_response") {
            setStatus("scanning");
            setMessage(data.status || "Scan requested successfully");
            setProgress(10);

            if (scanningTimeoutRef.current) {
              clearTimeout(scanningTimeoutRef.current);
              scanningTimeoutRef.current = setTimeout(() => {
                console.log(
                  "[SCAN WS] Scanning timeout - no updates received for 1 minute",
                );
                setError("Scanning timeout - please try again");
                setStatus("error");

                if (
                  wsRef.current &&
                  wsRef.current.readyState === WebSocket.OPEN
                ) {
                  wsRef.current.close();
                }
              }, 60000); // 1 minute
            }
          } else if (data.action === "update") {
            setStatus("scanning");
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

              setTimeout(() => {
                if (
                  wsRef.current &&
                  wsRef.current.readyState === WebSocket.OPEN
                ) {
                  console.log(
                    "[SCAN WS] User not found - closing connection and resetting",
                  );
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

              if (scanningTimeoutRef.current) {
                clearTimeout(scanningTimeoutRef.current);
                scanningTimeoutRef.current = setTimeout(() => {
                  console.log(
                    "[SCAN WS] Scanning timeout - no updates received for 1 minute",
                  );
                  setError("Scanning timeout - please try again");
                  setStatus("error");

                  if (
                    wsRef.current &&
                    wsRef.current.readyState === WebSocket.OPEN
                  ) {
                    wsRef.current.close();
                  }
                }, 60000); // 1 minute
              }
            } else if (
              data.message &&
              data.message.toLowerCase().includes("bot joined server")
            ) {
              setMessage(data.message);
              setProgress(75);

              if (scanningTimeoutRef.current) {
                clearTimeout(scanningTimeoutRef.current);
                scanningTimeoutRef.current = setTimeout(() => {
                  console.log(
                    "[SCAN WS] Scanning timeout - no updates received for 1 minute",
                  );
                  setError("Scanning timeout - please try again");
                  setStatus("error");

                  if (
                    wsRef.current &&
                    wsRef.current.readyState === WebSocket.OPEN
                  ) {
                    wsRef.current.close();
                  }
                }, 60000); // 1 minute
              }
            } else if (
              data.message &&
              data.message.toLowerCase().includes("added to queue")
            ) {
              const queueMessage = data.message;
              const positionMatch = queueMessage.match(/Position: (\d+)/);
              const delayMatch = queueMessage.match(/delay: ([\d.]+)/);

              let formattedMessage = queueMessage;
              if (positionMatch && delayMatch) {
                const position = parseInt(positionMatch[1]);
                const delaySeconds = parseFloat(delayMatch[1]);

                let delayText;
                if (delaySeconds < 60) {
                  delayText = `${Math.round(delaySeconds)}s`;
                } else if (delaySeconds < 3600) {
                  delayText = `${Math.round(delaySeconds / 60)}m ${Math.round(delaySeconds % 60)}s`;
                } else {
                  const hours = Math.floor(delaySeconds / 3600);
                  const minutes = Math.round((delaySeconds % 3600) / 60);
                  delayText = `${hours}h ${minutes}m`;
                }

                formattedMessage = `Added to queue - Position ${position} (${delayText} wait)`;
              }

              setMessage(formattedMessage);
              setProgress(100);
              setStatus("completed");

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
                } else {
                  setProgress(40);
                  setMessage(`Position ${position} in queue`);
                }
              }
            }
          } else if (data.action === "status") {
            setStatus(data.status || "scanning");
            setMessage(data.message || "Scanning...");
            console.log("[SCAN WS] Received status:", data);
            return;
          }

          if (data.status === "completed" || data.completed) {
            setStatus("completed");
            setProgress(100);
            setMessage("Scan completed successfully!");

            if (scanningTimeoutRef.current) {
              clearTimeout(scanningTimeoutRef.current);
              scanningTimeoutRef.current = null;
            }
          }
        } catch (err) {
          console.error("[SCAN WS] Parse error:", err);

          const quality = connectionQualityRef.current;
          const connectionDuration = Date.now() - quality.connectionStartTime;

          console.error("[SCAN WS] Connection quality at error:", {
            messagesReceived: quality.messagesReceived,
            connectionDuration: `${connectionDuration}ms`,
            compressionEnabled: quality.compressionEnabled,
            lastMessageAge: `${Date.now() - quality.lastMessageTime}ms`,
          });

          setError("Invalid response from server - connection may be unstable");
          setStatus("error");
        }
      });

      ws.addEventListener("close", (event) => {
        console.log("[SCAN WS] Closed:", event.code, event.reason);
        setIsConnected(false);

        const quality = connectionQualityRef.current;
        const connectionDuration = Date.now() - quality.connectionStartTime;

        console.log("[SCAN WS] Connection quality summary:", {
          duration: `${connectionDuration}ms`,
          messagesReceived: quality.messagesReceived,
          compressionEnabled: quality.compressionEnabled,
          closeCode: event.code,
          closeReason: event.reason,
        });

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (scanningTimeoutRef.current) {
          clearTimeout(scanningTimeoutRef.current);
          scanningTimeoutRef.current = null;
        }

        if (
          status === "scanning" &&
          event.code !== 1000 &&
          event.code !== 1001
        ) {
          if (!event.reason || event.reason.trim() === "") {
            if (reconnectAttemptsRef.current < 2) {
              reconnectAttemptsRef.current++;
              console.log(
                `[SCAN WS] Unexpected disconnection, attempting reconnection ${reconnectAttemptsRef.current}/2`,
              );

              setMessage(`Reconnecting... (${reconnectAttemptsRef.current}/2)`);

              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, 3000);
            } else {
              setError("Connection lost - please try again");
              setStatus("error");
            }
          } else {
            setError(`Connection closed: ${event.reason}`);
            setStatus("error");
          }
        } else if (
          status !== "completed" &&
          status !== "error" &&
          status !== "idle"
        ) {
          setError("Connection lost");
          setStatus("error");
        }
      });

      ws.addEventListener("error", (err) => {
        console.error("[SCAN WS] Error:", err);
        setError("WebSocket connection error");
        setStatus("error");
        setIsConnected(false);
      });
    } catch (err) {
      console.error("[SCAN WS] Connection error:", err);
      setError("Failed to connect to scan service");
      setStatus("error");
    }
  }, [userId, status]);

  const startScan = useCallback(() => {
    console.log("[SCAN WS] startScan called with userId:", userId);
    console.log("[SCAN WS] Current status:", status);
    console.log("[SCAN WS] ENABLE_WS_SCAN:", ENABLE_WS_SCAN);

    if (!userId) {
      console.log("[SCAN WS] No userId provided, setting error");
      setError("No user ID provided");
      setStatus("error");
      return;
    }

    if (!ENABLE_WS_SCAN) {
      console.log("[SCAN WS] WebSocket scanning disabled, setting error");
      setError("Inventory scanning is temporarily disabled");
      setStatus("error");
      setForceShowError(true); // Force error display on next render
      return;
    }

    console.log("[SCAN WS] Starting scan connection...");
    connect();
  }, [userId, connect, status]);

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

    if (scanningTimeoutRef.current) {
      clearTimeout(scanningTimeoutRef.current);
      scanningTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    setStatus("idle");
    setIsConnected(false);
    setMessage(undefined);
    setProgress(undefined);
    setError(undefined);
    setExpiresAt(undefined);
  }, []);

  const resetForceShowError = useCallback(() => {
    console.log("[SCAN WS] Resetting forceShowError flag");
    setForceShowError(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScan();
    };
  }, [stopScan]);

  return {
    status,
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
