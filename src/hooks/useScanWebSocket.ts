"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { INVENTORY_WS_URL } from "@/utils/api";

/**
 * WebSocket hook for managing inventory scan operations
 * Handles connection, retry logic, slowmode, and UI state management
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
}

interface UseScanWebSocketReturn {
  status: ScanStatus["status"];
  message: string | undefined;
  progress: number | undefined;
  error: string | undefined;
  isConnected: boolean;
  isSlowmode: boolean;
  slowmodeTimeLeft: number;
  startScan: () => void;
  stopScan: () => void;
}

export function useScanWebSocket(userId: string): UseScanWebSocketReturn {
  const [status, setStatus] = useState<ScanStatus["status"]>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isSlowmode, setIsSlowmode] = useState(false);
  const [slowmodeTimeLeft, setSlowmodeTimeLeft] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const slowmodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slowmodeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startSlowmode = useCallback((durationSeconds: number = 30) => {
    console.log(`[SCAN WS] Starting slowmode for ${durationSeconds} seconds`);
    setIsSlowmode(true);
    setSlowmodeTimeLeft(durationSeconds);

    if (slowmodeTimeoutRef.current) {
      clearTimeout(slowmodeTimeoutRef.current);
    }
    if (slowmodeIntervalRef.current) {
      clearInterval(slowmodeIntervalRef.current);
    }

    slowmodeIntervalRef.current = setInterval(() => {
      setSlowmodeTimeLeft((prev) => {
        if (prev <= 1) {
          setIsSlowmode(false);
          if (slowmodeIntervalRef.current) {
            clearInterval(slowmodeIntervalRef.current);
            slowmodeIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    slowmodeTimeoutRef.current = setTimeout(() => {
      setIsSlowmode(false);
      setSlowmodeTimeLeft(0);
      if (slowmodeIntervalRef.current) {
        clearInterval(slowmodeIntervalRef.current);
        slowmodeIntervalRef.current = null;
      }
    }, durationSeconds * 1000);
  }, []);

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

      connectionTimeoutRef.current = setTimeout(() => {
        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          console.log("[SCAN WS] Connection timeout");
          wsRef.current.close();
          setError("Connection timeout - please try again");
          setStatus("error");
        }
      }, 30000);

      ws.onopen = () => {
        console.log("[SCAN WS] Connected");
        setStatus("connected");
        setIsConnected(true);
        setError(undefined);
        reconnectAttemptsRef.current = 0;

        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        ws.send(JSON.stringify({ action: "request" }));
        setStatus("scanning");

        // Start scanning timeout (1 minute)
        scanningTimeoutRef.current = setTimeout(() => {
          console.log(
            "[SCAN WS] Scanning timeout - no updates received for 1 minute",
          );
          setError("Scanning timeout - please try again");
          setStatus("error");
          startSlowmode(40);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }
        }, 60000); // 1 minute

        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ action: "status" }));
              console.log("[SCAN WS] Sent status check");
            } catch (err) {
              console.error("[SCAN WS] Status check send failed:", err);
            }
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[SCAN WS] Received:", data);

          if (data.error && data.attempt && data.total_attempts) {
            if (data.attempt >= data.total_attempts) {
              console.log(
                "[SCAN WS] Max attempts reached, closing connection and resetting UI",
              );
              setError(`${data.error} - All attempts failed`);
              setStatus("error");
              startSlowmode(40);

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
              }, 3000);
              return;
            }

            setStatus("scanning");
            setMessage(
              `${data.error} - Retrying (${data.attempt}/${data.total_attempts})`,
            );
            setProgress(5);
            return;
          }

          if (data.error) {
            setError(data.error);
            setStatus("error");
            startSlowmode(40);
            return;
          }

          setError(undefined);

          if (data.action === "request_response") {
            setStatus("scanning");
            setMessage(data.status || "Scan requested successfully");
            setProgress(10);

            // Reset scanning timeout on real progress
            if (scanningTimeoutRef.current) {
              clearTimeout(scanningTimeoutRef.current);
              scanningTimeoutRef.current = setTimeout(() => {
                console.log(
                  "[SCAN WS] Scanning timeout - no updates received for 1 minute",
                );
                setError("Scanning timeout - please try again");
                setStatus("error");
                startSlowmode(40);

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

              // Reset scanning timeout on real progress
              if (scanningTimeoutRef.current) {
                clearTimeout(scanningTimeoutRef.current);
                scanningTimeoutRef.current = setTimeout(() => {
                  console.log(
                    "[SCAN WS] Scanning timeout - no updates received for 1 minute",
                  );
                  setError("Scanning timeout - please try again");
                  setStatus("error");
                  startSlowmode(40);

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

              // Reset scanning timeout on real progress
              if (scanningTimeoutRef.current) {
                clearTimeout(scanningTimeoutRef.current);
                scanningTimeoutRef.current = setTimeout(() => {
                  console.log(
                    "[SCAN WS] Scanning timeout - no updates received for 1 minute",
                  );
                  setError("Scanning timeout - please try again");
                  setStatus("error");
                  startSlowmode(40);

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
              startSlowmode(40);

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
            startSlowmode(40);

            // Clear scanning timeout on completion
            if (scanningTimeoutRef.current) {
              clearTimeout(scanningTimeoutRef.current);
              scanningTimeoutRef.current = null;
            }
          }
        } catch (err) {
          console.error("[SCAN WS] Parse error:", err);
          setError("Invalid response from server");
          setStatus("error");
        }
      };

      ws.onclose = (event) => {
        console.log("[SCAN WS] Closed:", event.code, event.reason);
        setIsConnected(false);

        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

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
      };

      ws.onerror = (err) => {
        console.error("[SCAN WS] Error:", err);
        setError("WebSocket connection error");
        setStatus("error");
        setIsConnected(false);
      };
    } catch (err) {
      console.error("[SCAN WS] Connection error:", err);
      setError("Failed to connect to scan service");
      setStatus("error");
    }
  }, [userId, status, startSlowmode]);

  const startScan = useCallback(() => {
    if (!userId) {
      setError("No user ID provided");
      setStatus("error");
      return;
    }

    if (isSlowmode) {
      console.log("[SCAN WS] Scan blocked by slowmode");
      return;
    }

    connect();
  }, [userId, connect, isSlowmode]);

  const stopScan = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (scanningTimeoutRef.current) {
      clearTimeout(scanningTimeoutRef.current);
      scanningTimeoutRef.current = null;
    }

    if (slowmodeTimeoutRef.current) {
      clearTimeout(slowmodeTimeoutRef.current);
      slowmodeTimeoutRef.current = null;
    }

    if (slowmodeIntervalRef.current) {
      clearInterval(slowmodeIntervalRef.current);
      slowmodeIntervalRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    setStatus("idle");
    setIsConnected(false);
    setMessage(undefined);
    setProgress(undefined);
    setError(undefined);
    setIsSlowmode(false);
    setSlowmodeTimeLeft(0);
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
    isConnected,
    isSlowmode,
    slowmodeTimeLeft,
    startScan,
    stopScan,
  };
}
