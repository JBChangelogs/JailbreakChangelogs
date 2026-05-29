"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ENABLE_REALTIME_NOTIFICATIONS_WS, WS_URL } from "@/utils/api/api";
import {
  getNotificationActionLabel,
  parseNotificationUrl,
} from "@/utils/notifications/notificationUrl";
import { showDesktopNotification } from "@/utils/notifications/desktopNotifications";
import {
  formatNotifPlainText,
  normalizeNotificationText,
  renderNotifDescription,
} from "@/utils/notifications/notifMarkdown";
import { buildApiWsUrl } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import {
  deleteCachedPreference,
  setCachedPreference,
  updatePreferencesCache,
} from "@/utils/preferences/realtimePreferencesCache";

const log = createLogger("WS");

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
  key?: string;
  value?: unknown;
  type?: string;
  id?: number | null;
  updates?: Array<{ id: number; type: string }>;
  data?:
    | RealtimeNotificationContent
    | RealtimeDmMessageData
    | Record<string, unknown>
    | {
        total_notifications?: number;
        type?: string;
        data?: RealtimeNotificationContent;
      };
}

interface RealtimeDmMessageData {
  id?: string | number;
  parent_id?: string | number | null;
  user_id?: string | number;
  recipient_id?: string | number;
  content?: string;
  metadata?: unknown | null;
}

const PING_INTERVAL_MS = 30000;
const MAX_RECONNECT_DELAY_MS = 15000;
const SOUND_COOLDOWN_MS = 800;
const MAX_HANDSHAKE_RETRIES = 3;
const FOCUS_ONLY_RECONNECT_CODES = new Set([4000, 4001]);

function shouldReconnectOnFocusOnly(code: number, reason: string): boolean {
  if (!FOCUS_ONLY_RECONNECT_CODES.has(code)) return false;
  if (code === 4000) return true;
  return (
    /another instance/i.test(reason) || /duplicate connection/i.test(reason)
  );
}

function toNotificationBody(value: unknown, maxLen = 140): string | undefined {
  if (typeof value !== "string") return undefined;
  const formatted = formatNotifPlainText(value.trim());
  if (!formatted) return undefined;
  if (formatted.length <= maxLen) return formatted;
  return `${formatted.slice(0, maxLen - 1)}…`;
}

function getRealtimeWsUrl(): string | null {
  const baseUrl = WS_URL?.replace(/\/+$/, "");
  if (!baseUrl) return null;

  return buildApiWsUrl(baseUrl, "/realtime", {
    tokenParamName: "token",
  });
}

function getReconnectDelay(attempt: number): number {
  const delay = Math.min(
    1000 * Math.pow(2, attempt - 1),
    MAX_RECONNECT_DELAY_MS,
  );
  return delay;
}

function parseRealtimeMessagePayload(raw: string): RealtimeNotificationMessage {
  // Preserve large snowflake-like IDs from websocket payloads.
  const normalized = raw.replace(
    /"(id|parent_id|user_id|recipient_id|sender_id|receiver_id)"\s*:\s*(\d{16,})/g,
    '"$1":"$2"',
  );
  return JSON.parse(normalized) as RealtimeNotificationMessage;
}

function openValidatedExternalNotificationUrl(validatedExternalHref: string) {
  window.open(validatedExternalHref, "_blank", "noopener,noreferrer");
}

export function useRealtimeNotificationsWebSocket(
  enabled: boolean,
  locationPath?: string | null,
): void {
  const isRealtimeNotificationsEnabled =
    enabled && ENABLE_REALTIME_NOTIFICATIONS_WS;
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSoundPlayedAtRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const enabledRef = useRef(enabled);
  const openedForAttemptRef = useRef(false);
  const disableAutoReconnectRef = useRef(false);
  const handshakeRetryAttemptsRef = useRef(0);
  const reconnectOnFocusOnlyRef = useRef(false);
  const locationPathRef = useRef<string>(
    typeof window !== "undefined" ? window.location?.pathname || "/" : "/",
  );
  const lastSentLocationRef = useRef<string>("");

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audios/notification_ding.mp3");
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  useEffect(() => {
    enabledRef.current = isRealtimeNotificationsEnabled;
  }, [isRealtimeNotificationsEnabled]);

  useEffect(() => {
    const nextPath =
      locationPath ??
      (typeof window !== "undefined" ? window.location?.pathname : null) ??
      "/";
    locationPathRef.current = nextPath;

    if (
      wsRef.current?.readyState === WebSocket.OPEN &&
      lastSentLocationRef.current !== nextPath
    ) {
      lastSentLocationRef.current = nextPath;
      wsRef.current.send(JSON.stringify({ location: nextPath }));
    }
  }, [locationPath]);

  // Forward user-initiated preference changes to the server when WS is open
  useEffect(() => {
    const handleSendPreference = (e: Event) => {
      const {
        key,
        value,
        delete: del,
      } = (e as CustomEvent<{ key: string; value?: unknown; delete?: boolean }>)
        .detail;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify(
            del
              ? { action: "delete_preference", key }
              : { action: "set_preference", key, value },
          ),
        );
      }
    };
    window.addEventListener("sendRealtimePreference", handleSendPreference);
    return () =>
      window.removeEventListener(
        "sendRealtimePreference",
        handleSendPreference,
      );
  }, []);

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
      if (wsRef.current) {
        wsRef.current.close(1000, "auth-disabled");
        wsRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      openedForAttemptRef.current = false;
      disableAutoReconnectRef.current = false;
      handshakeRetryAttemptsRef.current = 0;
      reconnectOnFocusOnlyRef.current = false;
      return;
    }

    let unmounted = false;

    const AUTH_WS_ERRORS: Record<number, string> = {
      4001: "Authentication token required.",
      4002: "Invalid authentication token.",
      4004: "Your account has been banned.",
    };

    const connect = () => {
      if (unmounted || !enabledRef.current) {
        return;
      }
      if (disableAutoReconnectRef.current) {
        return;
      }
      if (
        reconnectOnFocusOnlyRef.current &&
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
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
        const wsUrl = getRealtimeWsUrl();
        if (!wsUrl) {
          log.warn("Missing NEXT_PUBLIC_WS_URL");
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
          reconnectOnFocusOnlyRef.current = false;
          reconnectAttemptsRef.current = 0;

          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }

          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  action: "ping",
                  location: locationPathRef.current || "/",
                }),
              );
            }
          }, PING_INTERVAL_MS);

          const currentPath = locationPathRef.current || "/";
          lastSentLocationRef.current = currentPath;
          ws.send(JSON.stringify({ location: currentPath }));
        });

        ws.addEventListener("message", (event) => {
          try {
            const rawPayload =
              typeof event.data === "string" ? event.data : String(event.data);
            const payload = parseRealtimeMessagePayload(rawPayload);

            if (
              payload.action === "preferences_update" &&
              payload.data &&
              typeof payload.data === "object"
            ) {
              const data = payload.data as {
                action: string;
                key?: string;
                value?: unknown;
              };
              if (data.action === "set" && data.key) {
                setCachedPreference(data.key, data.value);
                window.dispatchEvent(
                  new CustomEvent("realtimePreference", {
                    detail: { key: data.key, value: data.value },
                  }),
                );
              } else if (data.action === "delete" && data.key) {
                deleteCachedPreference(data.key);
                window.dispatchEvent(
                  new CustomEvent("realtimePreferenceDeleted", {
                    detail: { key: data.key },
                  }),
                );
              }
              return;
            }

            if (
              (payload.action === "preferences" ||
                payload.action === "preferences_sync") &&
              payload.data &&
              typeof payload.data === "object"
            ) {
              updatePreferencesCache(payload.data as Record<string, unknown>);
              window.dispatchEvent(
                new CustomEvent("realtimePreferences", {
                  detail: payload.data,
                }),
              );
              return;
            }

            if (payload.action === "pong") return;

            if (payload.action === "error" && payload.code) {
              const errorMessage =
                AUTH_WS_ERRORS[payload.code] ||
                payload.message ||
                "Connection error.";
              const focusOnly = shouldReconnectOnFocusOnly(
                payload.code,
                errorMessage,
              );
              toast.error(
                focusOnly
                  ? "Realtime features disabled"
                  : "Realtime notifications disconnected",
                {
                  id: focusOnly
                    ? `realtime-notifications-disabled:${payload.code}`
                    : `realtime-notifications-error:${payload.code}`,
                  description: errorMessage,
                },
              );
              if (focusOnly) {
                reconnectOnFocusOnlyRef.current = true;
                if (reconnectTimeoutRef.current) {
                  clearTimeout(reconnectTimeoutRef.current);
                  reconnectTimeoutRef.current = null;
                }
              }
              ws.close(payload.code, errorMessage);
              return;
            }

            if (payload.data && typeof payload.data === "object") {
              const dmData = payload.data as RealtimeDmMessageData;
              const hasValidIds =
                (typeof dmData.id === "string" ||
                  typeof dmData.id === "number") &&
                (typeof dmData.user_id === "string" ||
                  typeof dmData.user_id === "number") &&
                (typeof dmData.recipient_id === "string" ||
                  typeof dmData.recipient_id === "number") &&
                (dmData.parent_id === undefined ||
                  dmData.parent_id === null ||
                  typeof dmData.parent_id === "string" ||
                  typeof dmData.parent_id === "number");

              if (
                (payload.action === "message_received" ||
                  payload.action === "message_sent" ||
                  payload.action === "message_edited") &&
                hasValidIds &&
                typeof dmData.content === "string"
              ) {
                window.dispatchEvent(
                  new CustomEvent("realtimeMessage", {
                    detail: {
                      action: payload.action,
                      data: {
                        id: String(dmData.id),
                        parent_id:
                          dmData.parent_id === null ||
                          dmData.parent_id === undefined
                            ? null
                            : String(dmData.parent_id),
                        user_id: String(dmData.user_id),
                        recipient_id: String(dmData.recipient_id),
                        content: dmData.content,
                        metadata: dmData.metadata ?? null,
                      },
                    },
                  }),
                );

                if (payload.action === "message_received") {
                  const senderId = String(dmData.user_id);
                  const messagePreview =
                    toNotificationBody(dmData.content) ??
                    "Check your messages.";
                  showDesktopNotification({
                    title: "New message",
                    body: messagePreview,
                    target: {
                      internalPath: `/messages/${encodeURIComponent(senderId)}`,
                    },
                    tag: `realtime-dm:${String(dmData.id)}`,
                  });
                  toast("New message", {
                    id: `realtime-dm:${String(dmData.id)}`,
                    description: messagePreview,
                    action: {
                      label: "Open chat",
                      onClick: () => {
                        window.location.assign(
                          `/messages/${encodeURIComponent(senderId)}`,
                        );
                      },
                    },
                  });

                  const now = Date.now();
                  const isOnCooldown =
                    now - lastSoundPlayedAtRef.current < SOUND_COOLDOWN_MS;
                  if (!isOnCooldown) {
                    const audio = ensureAudio();
                    audio.currentTime = 0;
                    lastSoundPlayedAtRef.current = now;
                    void audio.play().catch((error) => {
                      if (
                        error instanceof DOMException &&
                        error.name === "NotAllowedError"
                      ) {
                        return;
                      }
                      log.error("Failed to play notification sound", error);
                    });
                  }
                }
                return;
              }

              if (payload.action === "message_deleted" && hasValidIds) {
                window.dispatchEvent(
                  new CustomEvent("realtimeMessage", {
                    detail: {
                      action: payload.action,
                      data: {
                        id: String(dmData.id),
                        parent_id:
                          dmData.parent_id === null ||
                          dmData.parent_id === undefined
                            ? null
                            : String(dmData.parent_id),
                        user_id: String(dmData.user_id),
                        recipient_id: String(dmData.recipient_id),
                        metadata: dmData.metadata ?? null,
                      },
                    },
                  }),
                );
                return;
              }
            }

            if (payload.action === "login") {
              if (payload.message) {
                const msg = payload.message;
                setTimeout(() => toast.success(msg), 500);
              }
              return;
            }

            if (payload.action === "refresh_trades") {
              window.dispatchEvent(
                new CustomEvent("realtimeTrades", {
                  detail: { action: "refresh_trades" },
                }),
              );
              return;
            }

            if (payload.action === "refresh_suggestions") {
              for (const update of payload.updates ?? []) {
                window.dispatchEvent(
                  new CustomEvent("realtimeSuggestions", {
                    detail: {
                      action: "refresh_suggestions",
                      type: update.type,
                      id: update.id,
                    },
                  }),
                );
              }
              return;
            }

            if (payload.action === "refresh_suggestion") {
              window.dispatchEvent(
                new CustomEvent("realtimeSuggestion", {
                  detail: {
                    action: "refresh_suggestion",
                    type: payload.type ?? "new",
                  },
                }),
              );
              return;
            }

            if (
              payload.action !== "notification_received" ||
              !payload.data ||
              typeof payload.data !== "object" ||
              !("data" in payload.data) ||
              !payload.data.data
            ) {
              return;
            }

            const notificationPayload = payload.data as {
              total_notifications?: number;
              type?: string;
              data?: RealtimeNotificationContent;
            };
            const notificationData = notificationPayload.data;
            if (!notificationData) {
              return;
            }

            const { title, description, link } = notificationData;
            const notificationTitle = title || "New notification";
            const rawDescription =
              description || "You received a new notification.";
            const notificationDescription =
              formatNotifPlainText(rawDescription);
            const normalizedDescription =
              normalizeNotificationText(rawDescription);
            const type = notificationPayload.type || "unknown";
            const toastId = `realtime-notification:${type}:${link || notificationTitle}`;
            const shouldHideViewAction =
              notificationTitle.trim().toLowerCase() === "login detected";

            const urlInfo = link ? parseNotificationUrl(link) : null;
            const action = shouldHideViewAction
              ? undefined
              : link && urlInfo?.isWhitelisted
                ? {
                    label: getNotificationActionLabel(urlInfo),
                    onClick: () => {
                      if (!link) return;
                      if (
                        urlInfo.isJailbreakChangelogs &&
                        urlInfo.relativePath
                      ) {
                        window.location.assign(urlInfo.relativePath);
                        return;
                      }
                      if (
                        !urlInfo.isJailbreakChangelogs &&
                        urlInfo.validatedExternalHref
                      ) {
                        openValidatedExternalNotificationUrl(
                          urlInfo.validatedExternalHref,
                        );
                      }
                    },
                  }
                : undefined;

            toast(notificationTitle, {
              id: toastId,
              description: React.createElement(
                "div",
                { className: "text-muted-foreground text-sm leading-relaxed" },
                renderNotifDescription(normalizedDescription),
              ),
              action,
            });

            const desktopTarget = (() => {
              if (!link) return undefined;
              if (
                urlInfo?.isWhitelisted &&
                urlInfo.isJailbreakChangelogs &&
                urlInfo.relativePath
              ) {
                return {
                  internalPath: urlInfo.relativePath,
                };
              }
              if (
                urlInfo?.isWhitelisted &&
                !urlInfo.isJailbreakChangelogs &&
                urlInfo.validatedExternalHref
              ) {
                return {
                  validatedExternalHref: urlInfo.validatedExternalHref,
                };
              }
              return undefined;
            })();

            showDesktopNotification({
              title: notificationTitle,
              body: notificationDescription,
              target: desktopTarget,
              tag: toastId,
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
                log.error("Failed to play notification sound", error);
              });
            }

            window.dispatchEvent(
              new CustomEvent("notificationReceived", {
                detail: {
                  total_notifications:
                    payload.total_notifications ??
                    notificationPayload.total_notifications,
                  data: notificationData,
                  type: notificationPayload.type,
                },
              }),
            );
          } catch (error) {
            log.error("Message parse error", error);
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

          wsRef.current = null;
          if (shouldReconnectOnFocusOnly(event.code, event.reason || "")) {
            reconnectOnFocusOnlyRef.current = true;
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            toast.error("Realtime features disabled", {
              id: `realtime-notifications-disabled:${event.code}`,
              description: event.reason || "Connection closed.",
            });
            return;
          }
          if (event.code in AUTH_WS_ERRORS) {
            toast.error("Realtime notifications disconnected", {
              id: `realtime-notifications-error:${event.code}`,
              description: AUTH_WS_ERRORS[event.code],
            });
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

        ws.addEventListener("error", (event) => {
          log.error("Connection error", (event.target as WebSocket)?.url);
        });
      } catch (error) {
        log.error("Failed to connect", error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      if (reconnectOnFocusOnlyRef.current && enabledRef.current) {
        reconnectOnFocusOnlyRef.current = false;
        connect();
      }
    };

    const handleWindowFocus = () => {
      if (!enabledRef.current) return;
      if (!reconnectOnFocusOnlyRef.current) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      reconnectOnFocusOnlyRef.current = false;
      connect();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    connect();

    return () => {
      unmounted = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "unmount");
        wsRef.current = null;
      }
      audioRef.current = null;
      lastSoundPlayedAtRef.current = 0;
      reconnectAttemptsRef.current = 0;
      openedForAttemptRef.current = false;
      disableAutoReconnectRef.current = false;
      handshakeRetryAttemptsRef.current = 0;
      reconnectOnFocusOnlyRef.current = false;
    };
  }, [isRealtimeNotificationsEnabled, ensureAudio]);
}
