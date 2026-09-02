"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { toast } from "sonner";
import { createLogger } from "@/services/logger";
import { useAuthContext } from "@/contexts/AuthContext";
import type {
  ApiErrorResponse,
  ApiSendResponse,
  ConversationSummary,
  Message,
} from "@/utils/messages/types";
import {
  asId,
  normalizeTimestamp,
  resolveMessageParticipants,
} from "@/utils/messages/parsing";
import {
  getLatestMessage,
  sortConversationsByLatestMessage,
  trimLocalThreadMessages,
} from "@/utils/messages/sorting";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { BanError, parseBan, showBanToast } from "@/utils/api/ban";

const log = createLogger("UI");
type AuthContextValue = ReturnType<typeof useAuthContext>;
type Setter<T> = Dispatch<SetStateAction<T>>;

interface UseMessageMutationsOptions {
  selectedUserId: string | null;
  messages: Message[];
  conversations: ConversationSummary[];
  editContent: string;
  isSending: boolean;
  reportingMessage: Message | null;
  reportReason: string;
  deletingMessageId: string | null;
  localThreadMessagesByUserIdRef: RefObject<Map<string, Message[]>>;
  prepareMessageContentForApi: (text: string) => string;
  prepareMessageDisplayContent: (text: string) => string;
  handleSendMessage: (message: string) => void | Promise<void>;
  setIsSending: Setter<boolean>;
  setMessages: Setter<Message[]>;
  setConversations: Setter<ConversationSummary[]>;
  setEditingMessageId: Setter<string | null>;
  setEditContent: Setter<string>;
  setDeletingMessageId: Setter<string | null>;
  setReplyingToMessage: Setter<Message | null>;
  setReportingMessage: Setter<Message | null>;
  setReportReason: Setter<string>;
  setIsSubmittingReport: Setter<boolean>;
  setBan: AuthContextValue["setBan"];
  updateLocalThreadMessage: (
    userId: string,
    predicate: (message: Message) => boolean,
    patch: (message: Message) => Message,
  ) => void;
  removeLocalThreadMessage: (
    userId: string,
    predicate: (message: Message) => boolean,
  ) => void;
}

export function useMessageMutations({
  selectedUserId,
  messages,
  conversations,
  editContent,
  isSending,
  reportingMessage,
  reportReason,
  deletingMessageId,
  localThreadMessagesByUserIdRef,
  prepareMessageContentForApi,
  prepareMessageDisplayContent,
  handleSendMessage,
  setIsSending,
  setMessages,
  setConversations,
  setEditingMessageId,
  setEditContent,
  setDeletingMessageId,
  setReplyingToMessage,
  setReportingMessage,
  setReportReason,
  setIsSubmittingReport,
  setBan,
  updateLocalThreadMessage,
  removeLocalThreadMessage,
}: UseMessageMutationsOptions) {
  const handleEditMessage = async (messageId: string) => {
    const apiContent = prepareMessageContentForApi(editContent);
    const displayContent = prepareMessageDisplayContent(editContent);
    if (!apiContent || !selectedUserId || isSending) return;

    const originalMessage = messages.find((m) => m.id === messageId);
    if (originalMessage?.content === displayContent) {
      setEditingMessageId(null);
      setEditContent("");
      return;
    }

    let toastId: string | number | undefined;
    try {
      setIsSending(true);
      toastId = toast.loading("Saving changes...");
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url: editUrl, headers: editHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(selectedUserId)}/${encodeURIComponent(messageId)}`,
      );
      const response = await fetch(editUrl, {
        method: "PATCH",
        credentials: "include",
        headers: {
          ...editHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: apiContent }),
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

      if (!response.ok || !parsedBody?.success) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
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
            id: toastId,
          });
          return;
        }
        const apiErrorMessage =
          parsedBody?.message && typeof parsedBody.message === "string"
            ? parsedBody.message
            : parsedBody?.detail && typeof parsedBody.detail === "string"
              ? parsedBody.detail
              : typeof parsedBody?.detail === "object"
                ? parsedBody.detail.message
                : rawBody.trim() || "Failed to edit message";
        throw new Error(apiErrorMessage);
      }

      const resolvedParticipants = resolveMessageParticipants({
        senderCandidate: parsedBody.message?.user_id,
        receiverCandidate: parsedBody.message?.recipient_id,
        fallbackSenderId: originalMessage?.senderId ?? null,
        fallbackReceiverId: originalMessage?.receiverId ?? null,
      });

      const updatedMessage: Message = {
        id: asId(parsedBody.message?.id ?? messageId),
        parentId: originalMessage?.parentId,
        senderId:
          resolvedParticipants?.senderId ??
          asId(parsedBody.message?.user_id ?? originalMessage?.senderId),
        receiverId:
          resolvedParticipants?.receiverId ??
          asId(parsedBody.message?.recipient_id ?? originalMessage?.receiverId),
        content: parsedBody.message?.content ?? displayContent,
        createdAt: originalMessage?.createdAt,
        updatedAt: parsedBody.message?.updated_at
          ? normalizeTimestamp(parsedBody.message.updated_at)
          : Date.now(),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? updatedMessage : m)),
      );
      updateLocalThreadMessage(
        selectedUserId,
        (m) => m.id === messageId,
        () => updatedMessage,
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user.id === selectedUserId &&
          conversation.lastMessage?.id === messageId
            ? { ...conversation, lastMessage: updatedMessage }
            : conversation,
        ),
      );

      setEditingMessageId(null);
      setEditContent("");
      toast.success("Message edited", { id: toastId });
    } catch (error) {
      log.error("Error editing message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to edit message",
        { id: toastId },
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    skipConfirmation = false,
  ) => {
    if (!selectedUserId || isSending) return;

    const deleteTarget = messages.find((m) => m.id === messageId);
    const shouldDeleteLocallyOnly =
      deleteTarget?.id.startsWith("client-") &&
      (deleteTarget.status === "failed" || deleteTarget.status === "pending");
    const effectiveSkipConfirmation =
      skipConfirmation || shouldDeleteLocallyOnly;

    if (!effectiveSkipConfirmation && deletingMessageId !== messageId) {
      setDeletingMessageId(messageId);
      return;
    }

    let toastId: string | number | undefined;
    // Keep a copy of current messages for restoration if delete fails
    const previousMessages = [...messages];
    const previousConversationLastMessage = conversations.find(
      (conversation) => conversation.user.id === selectedUserId,
    )?.lastMessage;
    // Optimistically remove the message from UI
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    removeLocalThreadMessage(selectedUserId, (m) => m.id === messageId);
    setConversations((prev) => {
      const nextMessages = previousMessages.filter((m) => m.id !== messageId);
      const latestThreadMessage = getLatestMessage(nextMessages);
      const updated = prev.map((conversation) =>
        conversation.user.id === selectedUserId &&
        conversation.lastMessage?.id === messageId
          ? { ...conversation, lastMessage: latestThreadMessage }
          : conversation,
      );
      return sortConversationsByLatestMessage(updated);
    });
    setReplyingToMessage((prev) => (prev?.id === messageId ? null : prev));
    setDeletingMessageId(null);

    try {
      if (shouldDeleteLocallyOnly) {
        return;
      }
      toastId = toast.loading("Deleting message...");
      if (!PUBLIC_API_URL) {
        throw new Error("Public API URL is not configured");
      }

      const { url: deleteUrl, headers: deleteHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(selectedUserId)}/${encodeURIComponent(messageId)}`,
      );
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
        headers: deleteHeaders,
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
          throw new BanError();
        }
        throw new Error(
          await getResponseErrorMessage(response, "Failed to delete message"),
        );
      }

      toast.success("Message deleted", { id: toastId });
    } catch (error) {
      // If deletion failed, restore the previous state
      setMessages(previousMessages);
      const existingLocal =
        localThreadMessagesByUserIdRef.current.get(selectedUserId) ?? [];
      const prevIds = new Set(previousMessages.map((m) => m.id));
      localThreadMessagesByUserIdRef.current.set(
        selectedUserId,
        trimLocalThreadMessages([
          ...previousMessages,
          ...existingLocal.filter((m) => !prevIds.has(m.id)),
        ]),
      );
      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation.user.id === selectedUserId
            ? { ...conversation, lastMessage: previousConversationLastMessage }
            : conversation,
        );
        return sortConversationsByLatestMessage(updated);
      });
      log.error("Error deleting message:", error);
      if (!(error instanceof BanError)) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete message",
          { id: toastId },
        );
      }
    }
  };

  const handleRetryFailedMessage = async (failedMessage: Message) => {
    if (isSending) return;
    if (failedMessage.status !== "failed") return;
    if (!failedMessage.content?.trim()) return;

    await handleDeleteMessage(failedMessage.id, true);
    await handleSendMessage(failedMessage.content);
  };

  const handleReportMessage = async () => {
    if (!reportingMessage || !selectedUserId || !reportReason.trim()) return;
    if (!PUBLIC_API_URL) {
      toast.error("API URL is not configured");
      return;
    }

    setIsSubmittingReport(true);
    const toastId = toast.loading("Submitting report...");

    try {
      const { url: reportUrl, headers: reportHeaders } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/messages/${encodeURIComponent(selectedUserId)}/${encodeURIComponent(reportingMessage.id)}/report`,
      );
      const response = await fetch(reportUrl, {
        method: "POST",
        credentials: "include",
        headers: { ...reportHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });

      if (!response.ok) {
        const ban = parseBan(response);
        if (ban) {
          setBan(ban);
          toast.dismiss(toastId);
          showBanToast(ban);
          return;
        }
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }

      toast.success("Report submitted", { id: toastId });
      setReportingMessage(null);
      setReportReason("");
    } catch (error) {
      log.error("Error reporting message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return {
    handleEditMessage,
    handleDeleteMessage,
    handleRetryFailedMessage,
    handleReportMessage,
  };
}
