"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  ConversationSummary,
  Message,
  RealtimeMessageEventDetail,
} from "@/utils/messages/types";
import { asId } from "@/utils/messages/parsing";
import {
  getLatestMessage,
  sortConversationsByLatestMessage,
} from "@/utils/messages/sorting";

interface UseMessagesRealtimeOptions {
  currentUserId: string | null;
  isAuthenticated: boolean;
  selectedUserIdRef: RefObject<string | null>;
  wsSendFallbackTimeoutsRef: RefObject<Set<number>>;
  localThreadMessagesByUserIdRef: RefObject<Map<string, Message[]>>;
  updateLocalThreadMessage: (
    userId: string,
    predicate: (message: Message) => boolean,
    patch: (message: Message) => Message,
  ) => void;
  upsertLocalThreadMessage: (userId: string, message: Message) => void;
  removeLocalThreadMessage: (
    userId: string,
    predicate: (message: Message) => boolean,
  ) => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setConversations: Dispatch<SetStateAction<ConversationSummary[]>>;
  setReplyingToMessage: Dispatch<SetStateAction<Message | null>>;
}

export function useMessagesRealtime({
  currentUserId,
  isAuthenticated,
  selectedUserIdRef,
  wsSendFallbackTimeoutsRef,
  localThreadMessagesByUserIdRef,
  updateLocalThreadMessage,
  upsertLocalThreadMessage,
  removeLocalThreadMessage,
  setMessages,
  setConversations,
  setReplyingToMessage,
}: UseMessagesRealtimeOptions) {
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const recentRealtimeEventKeysRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      setIsRealtimeConnected(false);
      return;
    }

    const handleConnectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ connected?: boolean }>).detail;
      setIsRealtimeConnected(detail?.connected === true);
    };

    window.addEventListener(
      "realtimeNotificationsConnection",
      handleConnectionChange,
    );
    return () => {
      window.removeEventListener(
        "realtimeNotificationsConnection",
        handleConnectionChange,
      );
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const fallbackTimeouts = wsSendFallbackTimeoutsRef.current;

    return () => {
      fallbackTimeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      fallbackTimeouts.clear();
    };
  }, [wsSendFallbackTimeoutsRef]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      return;
    }

    const handleRealtimeMessage = (event: Event) => {
      const detail = (event as CustomEvent<RealtimeMessageEventDetail>).detail;
      const action = detail?.action;
      const payload = detail?.data;

      if (
        (action !== "message_received" &&
          action !== "message_sent" &&
          action !== "message_edited" &&
          action !== "message_deleted") ||
        !payload ||
        typeof payload.id !== "string" ||
        typeof payload.user_id !== "string" ||
        typeof payload.recipient_id !== "string" ||
        (payload.parent_id !== undefined &&
          payload.parent_id !== null &&
          typeof payload.parent_id !== "string") ||
        (action !== "message_deleted" && typeof payload.content !== "string")
      ) {
        return;
      }

      // Guard against duplicate realtime events (can happen in dev/strict-mode
      // or if multiple WS connections/event listeners exist briefly).
      {
        const now = Date.now();
        const key = `${action}:${payload.id}`;
        const recent = recentRealtimeEventKeysRef.current;
        const lastSeen = recent.get(key);
        if (typeof lastSeen === "number" && now - lastSeen < 2000) {
          return;
        }
        recent.set(key, now);
        // prune old keys
        for (const [k, t] of recent) {
          if (now - t > 10_000) {
            recent.delete(k);
          }
        }
      }

      const senderId = asId(payload.user_id);
      const receiverId = asId(payload.recipient_id);
      if (senderId !== currentUserId && receiverId !== currentUserId) {
        return;
      }

      const counterpartId = senderId === currentUserId ? receiverId : senderId;
      const messageId = asId(payload.id);

      if (action === "message_deleted") {
        removeLocalThreadMessage(counterpartId, (m) => m.id === messageId);
        setConversations((prev) => {
          const local =
            localThreadMessagesByUserIdRef.current.get(counterpartId) ?? [];
          const latestLocalMessage = getLatestMessage(local);
          const updated = prev.map((conversation) =>
            conversation.user.id === counterpartId &&
            conversation.lastMessage?.id === messageId
              ? { ...conversation, lastMessage: latestLocalMessage }
              : conversation,
          );
          return sortConversationsByLatestMessage(updated);
        });
        if (selectedUserIdRef.current === counterpartId) {
          setMessages((prev) => {
            const next = prev.filter((m) => m.id !== messageId);
            const latestThreadMessage = getLatestMessage(next);
            setConversations((conversationsPrev) => {
              const updated = conversationsPrev.map((conversation) =>
                conversation.user.id === counterpartId &&
                conversation.lastMessage?.id === messageId
                  ? { ...conversation, lastMessage: latestThreadMessage }
                  : conversation,
              );
              return sortConversationsByLatestMessage(updated);
            });
            return next;
          });
          setReplyingToMessage((prev) =>
            prev?.id === messageId ? null : prev,
          );
        }
        return;
      }

      const parentId = payload.parent_id ? asId(payload.parent_id) : null;
      const content = payload.content as string;

      if (action === "message_edited") {
        const editedAt = Date.now();
        updateLocalThreadMessage(
          counterpartId,
          (m) => m.id === messageId,
          (m) => ({
            ...m,
            parentId,
            content,
            updatedAt: editedAt,
          }),
        );
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user.id === counterpartId &&
            conversation.lastMessage?.id === messageId
              ? {
                  ...conversation,
                  lastMessage: {
                    ...conversation.lastMessage,
                    parentId,
                    content,
                    updatedAt: editedAt,
                  },
                }
              : conversation,
          ),
        );
        if (selectedUserIdRef.current === counterpartId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, parentId, content, updatedAt: editedAt }
                : m,
            ),
          );
        }
        return;
      }

      const realtimeMessage: Message = {
        id: messageId,
        parentId,
        senderId,
        receiverId,
        content,
        metadata:
          payload.metadata && typeof payload.metadata === "object"
            ? (payload.metadata as Record<string, unknown>)
            : null,
        createdAt: Date.now(),
        status: "sent",
      };

      const isOwnSend =
        action === "message_sent" && asId(senderId) === asId(currentUserId);

      if (isOwnSend) {
        const metadata =
          payload.metadata && typeof payload.metadata === "object"
            ? (payload.metadata as Record<string, unknown>)
            : null;
        const clientIdFromMetadata =
          metadata && typeof metadata.client_id === "string"
            ? metadata.client_id
            : null;

        let matchedLocal = false;
        if (clientIdFromMetadata) {
          updateLocalThreadMessage(
            counterpartId,
            (m) => m.clientId === clientIdFromMetadata,
            (m) => ({
              ...m,
              id: realtimeMessage.id,
              parentId: m.parentId ?? realtimeMessage.parentId ?? null,
              content: realtimeMessage.content,
              status: "sent",
            }),
          );
          matchedLocal = (
            localThreadMessagesByUserIdRef.current.get(counterpartId) ?? []
          ).some((m) => m.id === realtimeMessage.id);
        }

        if (!matchedLocal) {
          const now = Date.now();
          const maxAgeMs = 30_000;
          updateLocalThreadMessage(
            counterpartId,
            (m) => {
              if (m.status !== "pending") return false;
              if (asId(m.senderId) !== asId(senderId)) return false;
              if (asId(m.receiverId) !== asId(receiverId)) return false;
              if ((m.parentId ?? null) !== (realtimeMessage.parentId ?? null))
                return false;
              if (m.content !== realtimeMessage.content) return false;
              const createdAt = m.createdAt ?? 0;
              if (!createdAt) return false;
              return now - createdAt <= maxAgeMs;
            },
            (m) => ({ ...m, id: realtimeMessage.id, status: "sent" }),
          );
          matchedLocal = (
            localThreadMessagesByUserIdRef.current.get(counterpartId) ?? []
          ).some((m) => m.id === realtimeMessage.id);
        }

        if (!matchedLocal) {
          upsertLocalThreadMessage(counterpartId, realtimeMessage);
        }
      } else {
        upsertLocalThreadMessage(counterpartId, realtimeMessage);
      }

      if (selectedUserIdRef.current !== counterpartId) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.user.id === counterpartId
              ? { ...conversation, lastMessage: realtimeMessage }
              : conversation,
          ),
        );
        return;
      }

      setMessages((prev) => {
        const existing = prev.find((item) => item.id === realtimeMessage.id);
        if (existing) {
          return prev.map((item) =>
            item.id === realtimeMessage.id
              ? {
                  ...item,
                  parentId: item.parentId ?? realtimeMessage.parentId ?? null,
                  content: realtimeMessage.content,
                  status: "sent",
                }
              : item,
          );
        }

        if (isOwnSend) {
          const metadata =
            payload.metadata && typeof payload.metadata === "object"
              ? (payload.metadata as Record<string, unknown>)
              : null;
          const clientIdFromMetadata =
            metadata && typeof metadata.client_id === "string"
              ? metadata.client_id
              : null;

          if (clientIdFromMetadata) {
            const idx = prev.findIndex(
              (item) => item.clientId === clientIdFromMetadata,
            );
            if (idx !== -1) {
              return prev.map((item, i) =>
                i === idx
                  ? { ...item, id: realtimeMessage.id, status: "sent" }
                  : item,
              );
            }
          }

          const now = Date.now();
          const maxAgeMs = 30_000;
          const pendingIndex = [...prev].reverse().findIndex((item) => {
            if (item.status !== "pending") return false;
            if (asId(item.senderId) !== asId(senderId)) return false;
            if (asId(item.receiverId) !== asId(receiverId)) return false;
            if ((item.parentId ?? null) !== (realtimeMessage.parentId ?? null))
              return false;
            if (item.content !== realtimeMessage.content) return false;
            const createdAt = item.createdAt ?? 0;
            if (!createdAt) return false;
            return now - createdAt <= maxAgeMs;
          });

          if (pendingIndex !== -1) {
            const indexFromStart = prev.length - 1 - pendingIndex;
            return prev.map((item, idx) =>
              idx === indexFromStart
                ? { ...item, id: realtimeMessage.id, status: "sent" }
                : item,
            );
          }
        }

        return [...prev, realtimeMessage].sort(
          (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
        );
      });

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === counterpartId
            ? { ...conversation, lastMessage: realtimeMessage }
            : conversation,
        ),
      );
    };

    window.addEventListener("realtimeMessage", handleRealtimeMessage);
    return () => {
      window.removeEventListener("realtimeMessage", handleRealtimeMessage);
    };
  }, [
    currentUserId,
    isAuthenticated,
    updateLocalThreadMessage,
    upsertLocalThreadMessage,
    removeLocalThreadMessage,
    localThreadMessagesByUserIdRef,
    selectedUserIdRef,
    setConversations,
    setMessages,
    setReplyingToMessage,
  ]);

  return { isRealtimeConnected };
}
