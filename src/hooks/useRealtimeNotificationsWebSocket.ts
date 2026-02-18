"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ENABLE_REALTIME_NOTIFICATIONS_WS, WS_URL } from "@/utils/api";
import { parseNotificationUrl } from "@/utils/notificationUrl";

interface RealtimeNotificationContent {
  title?: string;
  description?: string;
  link?: string;
  metadata?: Record<string, unknown> | null;
}

interface RealtimeNotificationMessage {
  action?: string;
  code?: number;
  message?: string;
  total_notifications?: number;
  data?: {
    total_notifications?: number;
    type?: string;
    data?: RealtimeNotificationContent;
  };
}

const PING_INTERVAL_MS = 30000;
const IDLE_TIMEOUT_MS = 120000;
const MAX_RECONNECT_DELAY_MS = 15000;
const SOUND_COOLDOWN_MS = 800;
const MAX_HANDSHAKE_RETRIES = 3;

function getRealtimeWsUrl(): string | null {
  const baseUrl = WS_URL?.replace(/\/+$/, "");
  if (!baseUrl) return null;
  return `${baseUrl}/realtime`;
}

function getReconnectDelay(attempt: number): number {
  const delay = Math.min(
    1000 * Math.pow(2, attempt - 1),
    MAX_RECONNECT_DELAY_MS,
  );
  return delay;
}

export function useRealtimeNotificationsWebSocket(enabled: boolean): void {
  const isRealtimeNotificationsEnabled =
    enabled && ENABLE_REALTIME_NOTIFICATIONS_WS;
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayedAtRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const enabledRef = useRef(enabled);
  const isIdleRef = useRef(false);
  const openedForAttemptRef = useRef(false);
  const disableAutoReconnectRef = useRef(false);
  const handshakeRetryAttemptsRef = useRef(0);

  const closeForIdle = useCallback(() => {
    isIdleRef.current = true;
    if (wsRef.current) {
      wsRef.current.close(1000, "idle-timeout");
      wsRef.current = null;
    }
  }, []);

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audios/Notification_ding.wav");
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!enabledRef.current) return;
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = setTimeout(closeForIdle, IDLE_TIMEOUT_MS);
  }, [closeForIdle]);

  useEffect(() => {
    enabledRef.current = isRealtimeNotificationsEnabled;
  }, [isRealtimeNotificationsEnabled]);

  useEffect(() => {
    if (!isRealtimeNotificationsEnabled) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "auth-disabled");
        wsRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      isIdleRef.current = false;
      openedForAttemptRef.current = false;
      disableAutoReconnectRef.current = false;
      handshakeRetryAttemptsRef.current = 0;
      return;
    }

    let unmounted = false;

    const AUTH_WS_ERRORS: Record<number, string> = {
      4001: "Authentication token required.",
      4002: "Invalid authentication token.",
      4004: "Your account has been banned.",
    };

    const activityEvents: Array<keyof DocumentEventMap> = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const connect = () => {
      if (unmounted || !enabledRef.current) {
        return;
      }
      if (disableAutoReconnectRef.current) {
        return;
      }

      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      try {
        const wsUrl = getRealtimeWsUrl();
        if (!wsUrl) {
          console.warn(
            "[REALTIME NOTIFICATIONS WS] Missing NEXT_PUBLIC_WS_URL.",
          );
          return;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        openedForAttemptRef.current = false;

        ws.addEventListener("open", () => {
          window.dispatchEvent(
            new CustomEvent("realtimeNotificationsConnection", {
              detail: { connected: true },
            }),
          );
          openedForAttemptRef.current = true;
          disableAutoReconnectRef.current = false;
          handshakeRetryAttemptsRef.current = 0;
          isIdleRef.current = false;
          reconnectAttemptsRef.current = 0;
          resetIdleTimer();

          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }

          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ action: "ping" }));
            }
          }, PING_INTERVAL_MS);
        });

        ws.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(
              event.data,
            ) as RealtimeNotificationMessage;

            if (payload.action === "error" && payload.code) {
              const errorMessage =
                AUTH_WS_ERRORS[payload.code] ||
                payload.message ||
                "Connection error.";
              toast.error("Realtime notifications disconnected", {
                id: `realtime-notifications-error:${payload.code}`,
                description: errorMessage,
              });
              ws.close(payload.code, errorMessage);
              return;
            }

            if (
              payload.action !== "notification_received" ||
              !payload.data?.data
            ) {
              return;
            }

            const { title, description, link } = payload.data.data;
            const notificationTitle = title || "New notification";
            const notificationDescription =
              description || "You received a new notification.";
            const type = payload.data.type || "unknown";
            const toastId = `realtime-notification:${type}:${link || notificationTitle}`;

            const urlInfo = link ? parseNotificationUrl(link) : null;
            const action =
              link && urlInfo?.isWhitelisted
                ? {
                    label: "View",
                    onClick: () => {
                      if (!link) return;
                      if (
                        urlInfo.isJailbreakChangelogs &&
                        urlInfo.relativePath
                      ) {
                        window.location.assign(urlInfo.relativePath);
                        return;
                      }
                      if (!urlInfo.isJailbreakChangelogs && urlInfo.href) {
                        window.open(
                          urlInfo.href,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }
                    },
                  }
                : undefined;

            toast(notificationTitle, {
              id: toastId,
              description: notificationDescription,
              action,
            });

            const now = Date.now();
            const isOnCooldown =
              now - lastSoundPlayedAtRef.current < SOUND_COOLDOWN_MS;
            if (!isOnCooldown) {
              const audio = ensureAudio();
              audio.currentTime = 0;
              lastSoundPlayedAtRef.current = now;
              void audio.play().catch((error) => {
                // Ignore blocked autoplay errors; toast already surfaced the notification.
                if (
                  error instanceof DOMException &&
                  error.name === "NotAllowedError"
                ) {
                  return;
                }
                console.error(
                  "[REALTIME NOTIFICATIONS WS] Failed to play notification sound:",
                  error,
                );
              });
            }

            window.dispatchEvent(
              new CustomEvent("notificationReceived", {
                detail: {
                  total_notifications:
                    payload.total_notifications ??
                    payload.data?.total_notifications,
                  data: payload.data.data,
                  type: payload.data.type,
                },
              }),
            );
          } catch (error) {
            console.error(
              "[REALTIME NOTIFICATIONS WS] Message parse error:",
              error,
            );
          }
        });

        ws.addEventListener("close", (event) => {
          window.dispatchEvent(
            new CustomEvent("realtimeNotificationsConnection", {
              detail: { connected: false },
            }),
          );
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
            idleTimeoutRef.current = null;
          }

          wsRef.current = null;
          if (event.code in AUTH_WS_ERRORS) {
            toast.error("Realtime notifications disconnected", {
              id: `realtime-notifications-error:${event.code}`,
              description: AUTH_WS_ERRORS[event.code],
            });
            return;
          }

          if (isIdleRef.current || event.reason === "idle-timeout") {
            return;
          }

          // Handshake rejection (e.g. HTTP 403) typically surfaces as close 1006
          // without ever reaching "open". Retry with capped exponential backoff.
          if (!openedForAttemptRef.current && event.code === 1006) {
            handshakeRetryAttemptsRef.current += 1;
            const attempt = handshakeRetryAttemptsRef.current;

            if (
              attempt <= MAX_HANDSHAKE_RETRIES &&
              !unmounted &&
              enabledRef.current
            ) {
              const delay = getReconnectDelay(attempt);
              reconnectTimeoutRef.current = setTimeout(connect, delay);
              return;
            }

            disableAutoReconnectRef.current = true;
            toast.error("Live notifications offline", {
              id: "realtime-notifications-error:handshake-rejected",
              description:
                "Couldn't connect after 3 attempts. Refresh to try again.",
            });
            return;
          }

          if (
            !unmounted &&
            enabledRef.current &&
            event.code !== 1000 &&
            event.code !== 1001
          ) {
            reconnectAttemptsRef.current += 1;
            const delay = getReconnectDelay(reconnectAttemptsRef.current);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          }
        });

        ws.addEventListener("error", (error) => {
          console.error("[REALTIME NOTIFICATIONS WS] Connection error:", error);
        });
      } catch (error) {
        console.error("[REALTIME NOTIFICATIONS WS] Failed to connect:", error);
      }
    };

    const handleUserActivity = () => {
      if (isIdleRef.current && enabledRef.current) {
        isIdleRef.current = false;
        connect();
      }
      resetIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        return;
      }
      handleUserActivity();
    };

    activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleUserActivity, true);
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    connect();
    resetIdleTimer();

    return () => {
      unmounted = true;
      activityEvents.forEach((eventName) => {
        document.removeEventListener(eventName, handleUserActivity, true);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "unmount");
        wsRef.current = null;
      }
      audioRef.current = null;
      lastSoundPlayedAtRef.current = 0;
      reconnectAttemptsRef.current = 0;
      isIdleRef.current = false;
      openedForAttemptRef.current = false;
      disableAutoReconnectRef.current = false;
      handshakeRetryAttemptsRef.current = 0;
    };
  }, [isRealtimeNotificationsEnabled, ensureAudio, resetIdleTimer]);
}
