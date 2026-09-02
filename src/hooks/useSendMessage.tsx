"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";
import type { UserData } from "@/types/auth";
import {
  MESSAGE_CHAR_LIMIT,
  WS_SEND_FALLBACK_MS,
  type ApiErrorResponse,
  type ApiSendResponse,
  type ConversationSummary,
  type Message,
  type MessageUser,
} from "@/utils/messages/types";
import { asId, resolveMessageParticipants } from "@/utils/messages/parsing";
import {
  createClientMessageId,
  sortMessagesByCreatedAt,
} from "@/utils/messages/sorting";
import { PUBLIC_API_URL, getRateLimitMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseBan, showBanToast } from "@/utils/api/ban";

const log = createLogger("UI");
type AuthContextValue = ReturnType<typeof useAuthContext>;
type Setter<T> = Dispatch<SetStateAction<T>>;

interface UseSendMessageOptions {
  selectedUserId: string | null;
  selectedUser: MessageUser | null;
  currentUser: UserData | null;
  replyingToMessage: Message | null;
  isSending: boolean;
  isRealtimeConnected: boolean;
  selectedUserIdRef: RefObject<string | null>;
  pendingOwnSendScrollRef: RefObject<boolean>;
  wsSendFallbackTimeoutsRef: RefObject<Set<number>>;
  prepareMessageContentForApi: (text: string) => string;
  prepareMessageDisplayContent: (text: string) => string;
  setIsSending: Setter<boolean>;
  setMessages: Setter<Message[]>;
  setConversations: Setter<ConversationSummary[]>;
  setReplyingToMessage: Setter<Message | null>;
  setBan: AuthContextValue["setBan"];
  upsertLocalThreadMessage: (userId: string, message: Message) => void;
  updateLocalThreadMessage: (
    userId: string,
    predicate: (message: Message) => boolean,
    patch: (message: Message) => Message,
  ) => void;
}

export function useSendMessage({
  selectedUserId,
  selectedUser,
  currentUser,
  replyingToMessage,
  isSending,
  isRealtimeConnected,
  selectedUserIdRef,
  pendingOwnSendScrollRef,
  wsSendFallbackTimeoutsRef,
  prepareMessageContentForApi,
  prepareMessageDisplayContent,
  setIsSending,
  setMessages,
  setConversations,
  setReplyingToMessage,
  setBan,
  upsertLocalThreadMessage,
  updateLocalThreadMessage,
}: UseSendMessageOptions) {
  const handleSendMessage = async (rawMessage: string) => {
    if (!selectedUserId || !selectedUser) return;
    if (!currentUser) {
      toast.info("You need to be logged in to send messages");
      return;
    }

    const targetUserId = selectedUserId;
    const targetUser = selectedUser;
    const replyTarget = replyingToMessage;

    const apiContent = prepareMessageContentForApi(rawMessage);
    const displayContent = prepareMessageDisplayContent(rawMessage);
    if (!apiContent || isSending) return;
    if (apiContent.length > MESSAGE_CHAR_LIMIT) {
      toast.error(`Message too long (max ${MESSAGE_CHAR_LIMIT} characters).`);
      return;
    }

    const optimisticId = createClientMessageId();
    const optimisticMessage: Message = {
      id: optimisticId,
      clientId: optimisticId,
      parentId: replyTarget ? replyTarget.id : null,
      senderId: asId(currentUser.id),
      receiverId: asId(targetUserId),
      content: displayContent,
      metadata: { client_id: optimisticId },
      createdAt: Date.now(),
      status: "pending",
    };

    try {
      setIsSending(true);
      pendingOwnSendScrollRef.current = true;
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      upsertLocalThreadMessage(targetUserId, optimisticMessage);
      setMessages((prev) =>
        sortMessagesByCreatedAt([...prev, optimisticMessage]),
      );
      setConversations((prev) => [
        { user: targetUser, lastMessage: optimisticMessage },
        ...prev.filter((item) => item.user.id !== targetUserId),
      ]);
      setReplyingToMessage(null);

      const body: Record<string, unknown> = { content: apiContent };
      if (replyTarget) {
        body.parent_id = replyTarget.id;
      }
      body.metadata = { client_id: optimisticId };

      const { url: sendUrl, headers: sendHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(targetUserId)}`,
      );
      const response = await fetch(sendUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          ...sendHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const rawBody = await response.text();
      const parsedBody = rawBody
        ? (() => {
            try {
              return JSON.parse(rawBody) as ApiSendResponse & ApiErrorResponse;
            } catch {
              return null;
            }
          })()
        : null;

      const detailMessage =
        parsedBody?.detail && typeof parsedBody.detail === "object"
          ? parsedBody.detail.message
          : undefined;
      const apiErrorMessage =
        parsedBody?.detail && typeof parsedBody.detail === "string"
          ? parsedBody.detail
          : detailMessage && typeof detailMessage === "string"
            ? detailMessage
            : parsedBody?.message && typeof parsedBody.message === "string"
              ? parsedBody.message
              : parsedBody?.error && typeof parsedBody.error === "string"
                ? parsedBody.error
                : rawBody.trim();

      const combinedTooLongMessage =
        parsedBody?.error === "message_too_long" &&
        typeof parsedBody?.limit === "number"
          ? `Message too long (max ${parsedBody.limit} characters).`
          : null;
      const fallbackStatusMessage =
        response.status === 401
          ? "Unauthorized"
          : response.status === 429
            ? getRateLimitMessage()
            : "Failed to send message";

      if (!response.ok || !parsedBody?.success || !parsedBody.message) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          showBanToast(ban);
          return;
        }
        if (parsedBody?.error === "unmessageable") {
          const apiProvidedSystemMessage =
            parsedBody?.message && typeof parsedBody.message === "string"
              ? parsedBody.message.trim()
              : "";
          const systemContent =
            parsedBody?.reason === "not_mutual"
              ? "You and this user must follow each other to send and receive direct messages."
              : parsedBody?.reason === "blocked"
                ? "Your message could not be delivered. You are blocked from messaging this user."
                : parsedBody?.reason === "self" && apiProvidedSystemMessage
                  ? apiProvidedSystemMessage
                  : apiProvidedSystemMessage ||
                    "Your message could not be delivered.";
          toast.error(systemContent);
          const optimisticCreatedAt = optimisticMessage.createdAt ?? Date.now();
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            senderId: "system",
            receiverId: asId(targetUserId),
            content: systemContent,
            createdAt: Math.max(Date.now(), optimisticCreatedAt + 1),
            type: "system",
          };
          updateLocalThreadMessage(
            targetUserId,
            (m) => m.id === optimisticId,
            (m) => ({ ...m, status: "failed" as const }),
          );
          upsertLocalThreadMessage(targetUserId, systemMessage);
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.user.id === targetUserId
                ? { ...conversation, lastMessage: systemMessage }
                : conversation,
            ),
          );

          if (selectedUserIdRef.current === targetUserId) {
            setMessages((prev) =>
              sortMessagesByCreatedAt([
                ...prev.map((m) =>
                  m.id === optimisticId
                    ? { ...m, status: "failed" as const }
                    : m,
                ),
                systemMessage,
              ]),
            );
          }
          return;
        }

        if (parsedBody?.error === "profanity_detected") {
          const flagged =
            (parsedBody as { flagged?: { word: string }[] }).flagged ?? [];
          const words = flagged.map((f) => f.word).join(", ");
          const apiMessage =
            parsedBody.message ?? "Profanity was found in the provided text";
          toast.error("Profanity Detected", {
            description: (
              <span>
                {apiMessage}
                {words && (
                  <>
                    <br />
                    Flagged: {words}
                  </>
                )}
              </span>
            ),
          });
          updateLocalThreadMessage(
            targetUserId,
            (m) => m.id === optimisticId,
            (m) => ({ ...m, status: "failed" as const }),
          );
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.user.id === targetUserId &&
              conversation.lastMessage?.id === optimisticId
                ? {
                    ...conversation,
                    lastMessage: {
                      ...conversation.lastMessage,
                      status: "failed",
                    },
                  }
                : conversation,
            ),
          );
          if (selectedUserIdRef.current === targetUserId) {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === optimisticId ? { ...item, status: "failed" } : item,
              ),
            );
          }
          return;
        }

        throw new Error(
          combinedTooLongMessage || apiErrorMessage || fallbackStatusMessage,
        );
      }

      const serverMessageId = asId(parsedBody.message.id);
      const parentId = parsedBody.message.parent_id
        ? asId(parsedBody.message.parent_id)
        : null;
      const resolvedParticipants = resolveMessageParticipants({
        senderCandidate: parsedBody.message.user_id,
        receiverCandidate: parsedBody.message.recipient_id,
        fallbackSenderId: optimisticMessage.senderId,
        fallbackReceiverId: optimisticMessage.receiverId,
      });
      const shouldStayPending = isRealtimeConnected;
      const updatedLastMessage: Message = {
        ...optimisticMessage,
        id: serverMessageId,
        parentId,
        senderId: resolvedParticipants?.senderId ?? optimisticMessage.senderId,
        receiverId:
          resolvedParticipants?.receiverId ?? optimisticMessage.receiverId,
        content: parsedBody.message.content,
        status: shouldStayPending ? "pending" : "sent",
      };
      updateLocalThreadMessage(
        targetUserId,
        (m) => m.id === optimisticId,
        () => updatedLastMessage,
      );

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === targetUserId
            ? { ...conversation, lastMessage: updatedLastMessage }
            : conversation,
        ),
      );

      if (selectedUserIdRef.current === targetUserId) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === serverMessageId)) {
            return prev.filter((item) => item.id !== optimisticId);
          }

          return prev.map((item) =>
            item.id === optimisticId
              ? {
                  ...item,
                  id: serverMessageId,
                  parentId,
                  senderId:
                    resolvedParticipants?.senderId ??
                    optimisticMessage.senderId,
                  receiverId:
                    resolvedParticipants?.receiverId ??
                    optimisticMessage.receiverId,
                  content: parsedBody.message.content,
                  status: shouldStayPending ? "pending" : "sent",
                }
              : item,
          );
        });
      }

      if (shouldStayPending) {
        const timeoutId = window.setTimeout(() => {
          wsSendFallbackTimeoutsRef.current.delete(timeoutId);
          updateLocalThreadMessage(
            targetUserId,
            (m) => m.id === serverMessageId,
            (m) => (m.status === "pending" ? { ...m, status: "sent" } : m),
          );
          if (selectedUserIdRef.current !== targetUserId) {
            return;
          }
          setMessages((prev) =>
            prev.map((item) =>
              item.id === serverMessageId && item.status === "pending"
                ? { ...item, status: "sent" }
                : item,
            ),
          );
        }, WS_SEND_FALLBACK_MS);
        wsSendFallbackTimeoutsRef.current.add(timeoutId);
      }
    } catch (error) {
      pendingOwnSendScrollRef.current = false;
      log.error("Error sending message:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to send message";
      updateLocalThreadMessage(
        targetUserId,
        (m) => m.id === optimisticId,
        (m) => ({ ...m, status: "failed" }),
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === targetUserId &&
          conversation.lastMessage?.id === optimisticId
            ? {
                ...conversation,
                lastMessage: { ...conversation.lastMessage, status: "failed" },
              }
            : conversation,
        ),
      );
      if (selectedUserIdRef.current === targetUserId) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === optimisticId ? { ...item, status: "failed" } : item,
          ),
        );
      }
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return { handleSendMessage };
}
