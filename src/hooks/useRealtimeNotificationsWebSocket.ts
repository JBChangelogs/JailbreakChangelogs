"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ENABLE_REALTIME_NOTIFICATIONS_WS, WS_URL } from "@/utils/api/api";
import {
  getNotificationActionLabel,
  parseNotificationUrl,
} from "@/utils/notifications/notificationUrl";
import {
  shouldShowDesktopNotification,
  showDesktopNotification,
} from "@/utils/notifications/desktopNotifications";
import { NotifDescription } from "@/components/notifications/NotifDescription";
import { TwemojiText } from "@/components/ui/TwemojiText";
import {
  formatNotifPlainText,
  normalizeNotificationText,
} from "@/utils/notifications/notifMarkdown";
import { buildApiWsUrl } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import {
  clearPreferencesCache,
  deleteCachedPreference,
  getCachedPreferenceKeys,
  hasSyncedPreferences,
  markPreferencesUnsynced,
  replacePreferencesCache,
  setCachedPreference,
} from "@/utils/preferences/realtimePreferencesCache";
import {
  acknowledgePreferenceOperation,
  getPreferenceOutbox,
  getQueuedPreference,
  getUserPreferenceOutboxScope,
  migrateGuestPreferenceOutbox,
  overlayPreferenceOutbox,
  PreferenceOutboxScope,
  queuePreferenceOperation,
} from "@/utils/preferences/realtimePreferenceOutbox";
import { setRealtimeConnectionState } from "@/services/realtimeConnection";
import { fetchHasAppConnection } from "@/services/settingsService";

const log = createLogger("WS");

interface RealtimeNotificationContent {
  title?: string;
  description?: string;
  link?: string;
  metadata?: Record<string, unknown> | null;
}

interface RealtimeNotificationMessage {
  action?: string;
  supporter?: number;
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
  status?: "Online" | "Offline";
  reader_id?: string | number;
  message_ids?: Array<string | number>;
}

const PING_INTERVAL_MS = 30000;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 60000;
const SOUND_COOLDOWN_MS = 800;
const OFFLINE_NOTICE_ATTEMPT = 3;
const FOCUS_ONLY_RECONNECT_CODES = new Set([4000, 4001]);
const TERMINAL_RECONNECT_CODES = new Set([4001, 4002, 4004]);

function publishRealtimeConnectionState(connected: boolean): void {
  setRealtimeConnectionState(connected);
  window.dispatchEvent(
    new CustomEvent("realtimeNotificationsConnection", {
      detail: { connected },
    }),
  );
}

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

function isViewingMessageConversation(
  locationPath: string,
  senderId: string,
): boolean {
  const pathname = locationPath.split(/[?#]/, 1)[0] ?? "";
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "messages" || !parts[1]) return false;

  try {
    return decodeURIComponent(parts[1]) === senderId;
  } catch {
    return false;
  }
}

function getReconnectDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1)),
    MAX_RECONNECT_DELAY_MS,
  );
  return Math.round(
    exponentialDelay / 2 + Math.random() * (exponentialDelay / 2),
  );
}

function parseRealtimeMessagePayload(raw: string): RealtimeNotificationMessage {
  // Preserve large snowflake-like IDs from websocket payloads.
  const normalized = raw
    .replace(
      /"(id|parent_id|user_id|recipient_id|sender_id|receiver_id|reader_id)"\s*:\s*(\d{16,})/g,
      '"$1":"$2"',
    )
    .replace(
      /("message_ids"\s*:\s*\[)([^\]]*)\]/g,
      (_match, prefix: string, ids: string) =>
        `${prefix}${ids.replace(/(?<!["\d])(\d{16,})(?!["\d])/g, '"$1"')}]`,
    );
  return JSON.parse(normalized) as RealtimeNotificationMessage;
}

function openValidatedExternalNotificationUrl(validatedExternalHref: string) {
  window.open(validatedExternalHref, "_blank", "noopener,noreferrer");
}

function showDesktopNotificationUnlessAppConnected(
  notification: Parameters<typeof showDesktopNotification>[0],
): void {
  if (!shouldShowDesktopNotification()) return;

  void fetchHasAppConnection()
    .then((hasAppConnection) => {
      if (!hasAppConnection) {
        showDesktopNotification(notification);
      }
    })
    .catch(() => {
      // Do not lose browser notifications if the connection check fails.
      showDesktopNotification(notification);
    });
}

export function useRealtimeNotificationsWebSocket(
  enabled: boolean,
  locationPath?: string | null,
  onWebsiteBan?: (reason?: string) => void,
  onSupporterUpdated?: (level: number) => void,
  preferenceUserId?: string | null,
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
  const terminalCloseRef = useRef(false);
  const reconnectOnFocusOnlyRef = useRef(false);
  const manuallyDisconnectedRef = useRef(false);
  const connectRef = useRef<((reason: string) => void) | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  const locationPathRef = useRef<string>(
    typeof window !== "undefined"
      ? (window.location?.pathname || "/") + (window.location?.search || "")
      : "/",
  );
  const lastSentLocationRef = useRef<string>("");
  const rtDebugConnectCounterRef = useRef(0);
  const rtDebugEffectRunCounterRef = useRef(0);
  const rtDebugHistoryRef = useRef<
    Array<{ n: number; reason: string; at: string; preferenceScope: unknown }>
  >([]);
  const preferenceScope: PreferenceOutboxScope | null = preferenceUserId
    ? getUserPreferenceOutboxScope(preferenceUserId)
    : isRealtimeNotificationsEnabled
      ? null
      : "guest";

  useEffect(() => {
    if (preferenceScope?.startsWith("user:")) {
      migrateGuestPreferenceOutbox(preferenceScope);
    }
  }, [preferenceScope]);

  const flushPreferenceOutbox = useCallback(() => {
    if (!preferenceScope || wsRef.current?.readyState !== WebSocket.OPEN)
      return;
    for (const [key, operation] of Object.entries(
      getPreferenceOutbox(preferenceScope),
    )) {
      wsRef.current.send(
        JSON.stringify(
          operation.action === "delete"
            ? { action: "delete_preference", key }
            : { action: "set_preference", key, value: operation.value },
        ),
      );
    }
  }, [preferenceScope]);

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
      locationPath != null
        ? locationPath
        : typeof window !== "undefined"
          ? (window.location?.pathname ?? "") + (window.location?.search ?? "")
          : "/";
    locationPathRef.current = nextPath;

    if (
      wsRef.current?.readyState === WebSocket.OPEN &&
      lastSentLocationRef.current !== nextPath
    ) {
      lastSentLocationRef.current = nextPath;
      wsRef.current.send(JSON.stringify({ location: nextPath }));
    }
  }, [locationPath]);

  // Queue preference changes locally and forward them after a full snapshot.
  useEffect(() => {
    const handleSendPreference = (e: Event) => {
      const {
        key,
        value,
        delete: del,
      } = (e as CustomEvent<{ key: string; value?: unknown; delete?: boolean }>)
        .detail;
      const writeScope = preferenceScope ?? "guest";
      queuePreferenceOperation(
        writeScope,
        key,
        del ? { action: "delete" } : { action: "set", value },
      );
      if (
        preferenceScope &&
        wsRef.current?.readyState === WebSocket.OPEN &&
        hasSyncedPreferences()
      ) {
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
  }, [preferenceScope]);

  useEffect(() => {
    const handleSendTyping = (event: Event) => {
      const detail = (event as CustomEvent<{ recipient_id?: string }>).detail;
      if (
        typeof detail?.recipient_id !== "string" ||
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        return;
      }
      wsRef.current.send(
        JSON.stringify({
          action: "typing",
          recipient_id: detail.recipient_id,
        }),
      );
    };

    window.addEventListener("sendRealtimeTyping", handleSendTyping);
    return () => {
      window.removeEventListener("sendRealtimeTyping", handleSendTyping);
    };
  }, []);

  useEffect(() => {
    const handleMarkRead = (event: Event) => {
      const detail = (event as CustomEvent<{ sender_id?: string }>).detail;
      if (
        typeof detail?.sender_id !== "string" ||
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        return;
      }
      wsRef.current.send(
        JSON.stringify({
          type: "mark_read",
          sender_id: detail.sender_id,
        }),
      );
    };

    window.addEventListener("sendRealtimeMarkRead", handleMarkRead);
    return () => {
      window.removeEventListener("sendRealtimeMarkRead", handleMarkRead);
    };
  }, []);

  useEffect(() => {
    const handleManualDisconnect = () => {
      manuallyDisconnectedRef.current = true;
      toast.dismiss("realtime-notifications-reconnecting");
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "manual-disconnect");
        wsRef.current = null;
      }
      publishRealtimeConnectionState(false);
    };

    const handleManualConnect = () => {
      manuallyDisconnectedRef.current = false;
      terminalCloseRef.current = false;
      reconnectOnFocusOnlyRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      log.info("[RT-DEBUG] realtimeManualConnect event received");
      connectRef.current?.("manual-connect-event");
    };

    window.addEventListener("realtimeManualDisconnect", handleManualDisconnect);
    window.addEventListener("realtimeManualConnect", handleManualConnect);
    return () => {
      window.removeEventListener(
        "realtimeManualDisconnect",
        handleManualDisconnect,
      );
      window.removeEventListener("realtimeManualConnect", handleManualConnect);
    };
  }, []);

  useEffect(() => {
    rtDebugEffectRunCounterRef.current += 1;
    log.debug("[RT-DEBUG] main effect (re)run", {
      runNumber: rtDebugEffectRunCounterRef.current,
      isRealtimeNotificationsEnabled,
      preferenceScope,
    });

    if (!isRealtimeNotificationsEnabled) {
      clearPreferencesCache();
      publishRealtimeConnectionState(false);
      toast.dismiss("realtime-notifications-reconnecting");
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
      terminalCloseRef.current = false;
      reconnectOnFocusOnlyRef.current = false;
      connectedAtRef.current = null;
      return;
    }

    let unmounted = false;

    const AUTH_WS_ERRORS: Record<number, string> = {
      4001: "Authentication token required.",
      4002: "Invalid authentication token.",
      4004: "Your account has been banned.",
    };

    const clearReconnectTimeout = () => {
      if (!reconnectTimeoutRef.current) return;
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    };

    const canReconnect = () =>
      !unmounted &&
      enabledRef.current &&
      !terminalCloseRef.current &&
      !manuallyDisconnectedRef.current;

    const scheduleReconnect = (source: string) => {
      if (!canReconnect() || reconnectTimeoutRef.current) return;
      if (document.visibilityState !== "visible") {
        log.info("[RT-DEBUG] Reconnect paused while document is hidden", {
          source,
        });
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        log.info("[RT-DEBUG] Reconnect paused while browser is offline", {
          source,
        });
        return;
      }

      reconnectAttemptsRef.current += 1;
      const attempt = reconnectAttemptsRef.current;
      const delay = getReconnectDelay(attempt);
      log.warn("[RT-DEBUG] Realtime reconnect scheduled", {
        connectNumber: rtDebugConnectCounterRef.current,
        effectRunNumber: rtDebugEffectRunCounterRef.current,
        source,
        attempt,
        delay,
        online: navigator.onLine,
        visibility: document.visibilityState,
      });

      if (attempt === OFFLINE_NOTICE_ATTEMPT) {
        toast.error("Realtime features temporarily unavailable", {
          id: "realtime-notifications-reconnecting",
          description: "We'll keep trying to reconnect in the background.",
          duration: Infinity,
          action: {
            label: "Retry now",
            onClick: () => {
              window.dispatchEvent(new CustomEvent("realtimeManualConnect"));
            },
          },
        });
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect(`scheduled-reconnect:${source}`);
      }, delay);
    };

    const connect = (reason: string) => {
      if (unmounted || !enabledRef.current) {
        return;
      }
      if (terminalCloseRef.current || manuallyDisconnectedRef.current) {
        return;
      }
      if (document.visibilityState !== "visible") return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

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

        rtDebugConnectCounterRef.current += 1;
        rtDebugHistoryRef.current.push({
          n: rtDebugConnectCounterRef.current,
          reason,
          at: new Date().toISOString(),
          preferenceScope,
        });
        log.debug("[RT-DEBUG] opening WebSocket", {
          connectNumber: rtDebugConnectCounterRef.current,
          effectRunNumber: rtDebugEffectRunCounterRef.current,
          reason,
          preferenceScope,
          history: [...rtDebugHistoryRef.current],
        });

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        openedForAttemptRef.current = false;

        ws.addEventListener("open", () => {
          markPreferencesUnsynced();
          publishRealtimeConnectionState(true);
          openedForAttemptRef.current = true;
          connectedAtRef.current = Date.now();
          terminalCloseRef.current = false;
          const wasDisconnected =
            reconnectAttemptsRef.current > 0 || reconnectOnFocusOnlyRef.current;
          reconnectOnFocusOnlyRef.current = false;
          reconnectAttemptsRef.current = 0;
          if (wasDisconnected) {
            toast.dismiss("realtime-notifications-reconnecting");
            toast.success("Realtime features reconnected", {
              id: "realtime-notifications-reconnected",
            });
          }

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
          ws.send(JSON.stringify({ action: "get_preferences" }));
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
                if (!preferenceScope) return;
                acknowledgePreferenceOperation(preferenceScope, data.key, {
                  action: "set",
                  value: data.value,
                });
                const pending = getQueuedPreference(preferenceScope, data.key);
                if (pending?.action === "delete") {
                  deleteCachedPreference(data.key);
                  window.dispatchEvent(
                    new CustomEvent("realtimePreferenceDeleted", {
                      detail: { key: data.key },
                    }),
                  );
                } else {
                  const value =
                    pending?.action === "set" ? pending.value : data.value;
                  setCachedPreference(data.key, value);
                  window.dispatchEvent(
                    new CustomEvent("realtimePreference", {
                      detail: { key: data.key, value },
                    }),
                  );
                }
              } else if (data.action === "delete" && data.key) {
                if (!preferenceScope) return;
                acknowledgePreferenceOperation(preferenceScope, data.key, {
                  action: "delete",
                });
                const pending = getQueuedPreference(preferenceScope, data.key);
                if (pending?.action === "set") {
                  setCachedPreference(data.key, pending.value);
                  window.dispatchEvent(
                    new CustomEvent("realtimePreference", {
                      detail: { key: data.key, value: pending.value },
                    }),
                  );
                } else {
                  deleteCachedPreference(data.key);
                  window.dispatchEvent(
                    new CustomEvent("realtimePreferenceDeleted", {
                      detail: { key: data.key },
                    }),
                  );
                }
              } else if (data.action === "clear") {
                const previousKeys = getCachedPreferenceKeys();
                const preferences = preferenceScope
                  ? overlayPreferenceOutbox(preferenceScope, {})
                  : {};
                replacePreferencesCache(preferences);
                for (const key of previousKeys) {
                  if (key in preferences) continue;
                  window.dispatchEvent(
                    new CustomEvent("realtimePreferenceDeleted", {
                      detail: { key },
                    }),
                  );
                }
                window.dispatchEvent(
                  new CustomEvent("realtimePreferences", {
                    detail: preferences,
                  }),
                );
                flushPreferenceOutbox();
              }
              return;
            }

            if (
              (payload.action === "preferences" ||
                payload.action === "preferences_sync") &&
              payload.data &&
              typeof payload.data === "object"
            ) {
              const serverPreferences = payload.data as Record<string, unknown>;
              const preferences = preferenceScope
                ? overlayPreferenceOutbox(preferenceScope, serverPreferences)
                : serverPreferences;
              replacePreferencesCache(preferences);
              window.dispatchEvent(
                new CustomEvent("realtimePreferences", {
                  detail: preferences,
                }),
              );
              flushPreferenceOutbox();
              return;
            }

            if (payload.action === "pong") return;

            if (
              payload.action === "supporter_updated" &&
              typeof payload.supporter === "number" &&
              Number.isInteger(payload.supporter) &&
              payload.supporter >= 0 &&
              payload.supporter <= 3
            ) {
              onSupporterUpdated?.(payload.supporter);
              return;
            }

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
                  : "Realtime features disconnected",
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
              if (
                payload.action === "presence_update" &&
                (typeof dmData.user_id === "string" ||
                  typeof dmData.user_id === "number") &&
                (dmData.status === "Online" || dmData.status === "Offline")
              ) {
                window.dispatchEvent(
                  new CustomEvent("realtimeMessage", {
                    detail: {
                      action: "presence_update",
                      data: {
                        user_id: String(dmData.user_id),
                        status: dmData.status,
                      },
                    },
                  }),
                );
                return;
              }

              if (
                payload.action === "typing" &&
                (typeof dmData.user_id === "string" ||
                  typeof dmData.user_id === "number")
              ) {
                window.dispatchEvent(
                  new CustomEvent("realtimeMessage", {
                    detail: {
                      action: "typing",
                      data: { user_id: String(dmData.user_id) },
                    },
                  }),
                );
                return;
              }

              if (
                payload.action === "messages_read" &&
                (typeof dmData.reader_id === "string" ||
                  typeof dmData.reader_id === "number") &&
                Array.isArray(dmData.message_ids) &&
                dmData.message_ids.every(
                  (id) => typeof id === "string" || typeof id === "number",
                )
              ) {
                window.dispatchEvent(
                  new CustomEvent("realtimeMessage", {
                    detail: {
                      action: "messages_read",
                      data: {
                        reader_id: String(dmData.reader_id),
                        message_ids: dmData.message_ids.map(String),
                      },
                    },
                  }),
                );
                return;
              }

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
                  showDesktopNotificationUnlessAppConnected({
                    title: "New message",
                    body: messagePreview,
                    target: {
                      internalPath: `/messages/${encodeURIComponent(senderId)}`,
                    },
                    tag: `realtime-dm:${String(dmData.id)}`,
                  });
                  if (
                    !isViewingMessageConversation(
                      locationPathRef.current,
                      senderId,
                    )
                  ) {
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
                  }

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

            if (payload.action === "refresh_comments") {
              window.dispatchEvent(
                new CustomEvent("realtimeComments", {
                  detail: { action: "refresh_comments" },
                }),
              );
              return;
            }

            if (payload.action === "refresh_values") {
              window.dispatchEvent(
                new CustomEvent("realtimeValues", {
                  detail: { action: "refresh_values" },
                }),
              );
              return;
            }

            if (payload.action === "refresh_item") {
              window.dispatchEvent(
                new CustomEvent("realtimeItem", {
                  detail: { action: "refresh_item" },
                }),
              );
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

            toast(React.createElement(TwemojiText, null, notificationTitle), {
              id: toastId,
              description: React.createElement(NotifDescription, {
                text: normalizedDescription,
              }),
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

            const desktopNotification = {
              title: notificationTitle,
              body: notificationDescription,
              target: desktopTarget,
              tag: toastId,
            };

            showDesktopNotificationUnlessAppConnected(desktopNotification);

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
          if (wsRef.current && wsRef.current !== ws) return;

          publishRealtimeConnectionState(false);
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          const connectionDurationMs = connectedAtRef.current
            ? Date.now() - connectedAtRef.current
            : 0;
          connectedAtRef.current = null;
          if (wsRef.current === ws) wsRef.current = null;

          log.warn("[RT-DEBUG] Realtime connection closed", {
            connectNumber: rtDebugConnectCounterRef.current,
            effectRunNumber: rtDebugEffectRunCounterRef.current,
            code: event.code,
            reason: event.reason || undefined,
            clean: event.wasClean,
            opened: openedForAttemptRef.current,
            connectionDurationMs,
            reconnectAttempt: reconnectAttemptsRef.current,
            online: navigator.onLine,
            visibility: document.visibilityState,
          });

          if (event.code === 4004) {
            terminalCloseRef.current = true;
            onWebsiteBan?.(event.reason || AUTH_WS_ERRORS[event.code]);
            return;
          }
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
          if (TERMINAL_RECONNECT_CODES.has(event.code)) {
            terminalCloseRef.current = true;
            toast.error("Realtime features disconnected", {
              id: `realtime-notifications-error:${event.code}`,
              description:
                event.reason ||
                AUTH_WS_ERRORS[event.code] ||
                "Connection closed.",
            });
            return;
          }

          if (event.code !== 1000) scheduleReconnect(`close:${event.code}`);
        });

        ws.addEventListener("error", () => {
          log.error("Realtime transport error");
        });
      } catch (error) {
        log.error("Failed to connect", error);
        scheduleReconnect("constructor-error");
      }
    };

    const reconnectNow = (source: string) => {
      if (!canReconnect()) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }
      clearReconnectTimeout();
      log.info("[RT-DEBUG] Realtime reconnect requested", {
        connectNumber: rtDebugConnectCounterRef.current,
        effectRunNumber: rtDebugEffectRunCounterRef.current,
        source,
      });
      connect(`reconnect-now:${source}`);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      reconnectNow("visibility");
    };

    const handleWindowFocus = () => {
      if (document.visibilityState !== "visible") return;
      reconnectNow("focus");
    };

    const handleOnline = () => reconnectNow("online");

    connectRef.current = connect;

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleOnline);

    connect(`effect-mount:${rtDebugEffectRunCounterRef.current}`);

    return () => {
      unmounted = true;
      log.debug("[RT-DEBUG] main effect cleanup", {
        effectRunNumber: rtDebugEffectRunCounterRef.current,
        hadOpenSocket: wsRef.current?.readyState === WebSocket.OPEN,
      });
      publishRealtimeConnectionState(false);
      toast.dismiss("realtime-notifications-reconnecting");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleOnline);
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
      terminalCloseRef.current = false;
      reconnectOnFocusOnlyRef.current = false;
      manuallyDisconnectedRef.current = false;
      connectedAtRef.current = null;
      connectRef.current = null;
    };
  }, [
    isRealtimeNotificationsEnabled,
    ensureAudio,
    flushPreferenceOutbox,
    onWebsiteBan,
    onSupporterUpdated,
    preferenceScope,
  ]);
}
